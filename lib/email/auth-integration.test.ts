import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {betterAuth} from "better-auth";
import {memoryAdapter} from "better-auth/adapters/memory";
vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({send:vi.fn(),tasks:[] as Array<()=>Promise<unknown>>}));
vi.mock("./resend",()=>({getResendClient:()=>({emails:{send:mocks.send}})}));
vi.mock("next/server",()=>({after:(task:()=>Promise<unknown>)=>mocks.tasks.push(task)}));
import {createEmailAuthOptions} from "./auth-options";

beforeEach(()=>{
  mocks.send.mockReset().mockResolvedValue({data:{id:"accepted-test-email"},error:null});
  mocks.tasks.length=0;
  vi.stubEnv("NODE_ENV","test");
  vi.stubEnv("VERCEL_ENV","");
  vi.stubEnv("EMAIL_FROM","CarXSailor <onboarding@resend.dev>");
  vi.stubEnv("RESEND_TEST_EMAIL","developer@example.com");
  vi.stubEnv("NEXT_PUBLIC_APP_URL","http://localhost:3000");
  vi.spyOn(console,"info").mockImplementation(()=>{});
  vi.spyOn(console,"error").mockImplementation(()=>{});
});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
function setup() {
  const database:Record<string,Record<string,unknown>[]>= {user:[],session:[],account:[],verification:[]};
  async function verify(email:string):Promise<void> {
    await service.api.sendVerificationEmail({body:{email,callbackURL:"http://localhost:3000/verify-email"}});
  }
  const service=betterAuth({
    database:memoryAdapter(database),
    secret:"isolated-email-test-secret-at-least-thirty-two-characters",
    baseURL:"http://localhost:3000",
    ...createEmailAuthOptions(verify),
    rateLimit:{enabled:false},
    advanced:{disableOriginCheck:false,disableCSRFCheck:false},
    logger:{disabled:true},
  });
  return {service,database};
}
function linkIn(text:string,label:string) {
  const line=text.split("\n").find(line=>line.startsWith(label+": "));
  if(!line) throw new Error("Missing CTA.");
  return new URL(line.slice(label.length+2));
}
it("registers successfully, then sends welcome and a working Better Auth verification link to the test inbox",async()=>{
  const {service}=setup();
  const account=await service.api.signUpEmail({body:{name:"Alex Seller",email:"seller@example.com",password:"test-password-123"}});
  expect(account.user.emailVerified).toBe(false);
  expect(mocks.send).not.toHaveBeenCalled();
  for(const task of mocks.tasks) await task();
  expect(mocks.send).toHaveBeenCalledTimes(2);
  for(const [payload]of mocks.send.mock.calls) expect(payload.to).toBe("developer@example.com");
  const welcome=mocks.send.mock.calls.find(([payload])=>payload.subject==="[TEST] Welcome to CarXSailor");
  expect(welcome).toBeDefined();
  const verification=mocks.send.mock.calls.find(([payload])=>payload.subject==="[TEST] Verify your CarXSailor email")![0];
  const url=linkIn(verification.text,"Verify Email");
  expect(url.pathname).toBe("/api/auth/verify-email");
  expect(url.searchParams.get("callbackURL")).toBe("http://localhost:3000/verify-email");
  const token=url.searchParams.get("token")!;
  expect(token.split(".")).toHaveLength(3);
  const result=await service.api.verifyEmail({query:{token}});
  expect(result).toMatchObject({status:true});
  const signedIn=await service.api.signInEmail({body:{email:"seller@example.com",password:"test-password-123"}});
  expect(signedIn.user.emailVerified).toBe(true);
});
it("issues a working password-reset link, resets once, and rejects token reuse",async()=>{
  const {service,database}=setup();
  await service.api.signUpEmail({body:{name:"Alex",email:"seller@example.com",password:"original-password-123"}});
  await service.api.requestPasswordReset({body:{email:"seller@example.com",redirectTo:"/reset-password"}});
  const url=linkIn(mocks.send.mock.calls[0][0].text,"Reset Password");
  expect(url.origin).toBe("http://localhost:3000");
  expect(url.pathname).toMatch(/^\/api\/auth\/reset-password\/[^/]+$/);
  expect(url.searchParams.get("callbackURL")).toBe("/reset-password");
  const response=await service.handler(new Request(url));
  expect(response.status).toBe(302);
  const callback=new URL(response.headers.get("location")!,"http://localhost:3000");
  expect(callback.pathname).toBe("/reset-password");
  const token=callback.searchParams.get("token")!;
  expect(database.verification).toHaveLength(1);
  expect(JSON.stringify(database.verification)).not.toContain(token);
  await expect(service.api.resetPassword({body:{token,newPassword:"replacement-password-123"}})).resolves.toMatchObject({status:true});
  await expect(service.api.signInEmail({body:{email:"seller@example.com",password:"replacement-password-123"}})).resolves.toHaveProperty("user");
  await expect(service.api.resetPassword({body:{token,newPassword:"another-password-123"}})).rejects.toBeDefined();
});
it("keeps the account/session when post-signup email fails, but reports failed explicit security requests",async()=>{
  const {service,database}=setup();
  mocks.send.mockResolvedValue({data:null,error:{name:"validation_error"}});
  const result=await service.api.signUpEmail({body:{name:"Alex",email:"seller@example.com",password:"test-password-123"}});
  for(const task of mocks.tasks) await expect(task()).resolves.toBeUndefined();
  expect(result.token).toBeTruthy();
  expect(database.user).toHaveLength(1);
  expect(database.session).toHaveLength(1);
  await expect(service.api.sendVerificationEmail({body:{email:"seller@example.com",callbackURL:"/verify-email"}})).rejects.toMatchObject({statusCode:503});
  await expect(service.api.requestPasswordReset({body:{email:"seller@example.com",redirectTo:"/reset-password"}})).rejects.toMatchObject({statusCode:503});
});
it("rejects external reset redirects and keeps unknown-account reset responses generic",async()=>{
  const {service}=setup();
  const invalid=await service.handler(new Request("http://localhost:3000/api/auth/request-password-reset",{
    method:"POST",headers:{"content-type":"application/json",origin:"http://localhost:3000"},
    body:JSON.stringify({email:"unknown@example.com",redirectTo:"https://evil.example.com/reset"}),
  }));
  expect(invalid.status).toBe(403);
  await expect(service.api.requestPasswordReset({body:{email:"unknown@example.com",redirectTo:"/reset-password"}})).resolves.toMatchObject({status:true});
  expect(mocks.send).not.toHaveBeenCalled();
});
