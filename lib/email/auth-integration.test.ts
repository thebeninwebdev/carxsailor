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
  vi.stubEnv("NODE_ENV","test");vi.stubEnv("VERCEL_ENV","");
  vi.stubEnv("EMAIL_FROM","");
  vi.stubEnv("EMAIL_FROM_NAME","CarXSailor");
  vi.stubEnv("EMAIL_FROM_ADDRESS","noreply@swiftdu.example");
  vi.stubEnv("NEXT_PUBLIC_APP_URL","http://localhost:3000");
  vi.spyOn(console,"info").mockImplementation(()=>{});vi.spyOn(console,"error").mockImplementation(()=>{});
});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
function setup(){
  const database:Record<string,Record<string,unknown>[]>= {user:[],session:[],account:[],verification:[]};
  const service=betterAuth({database:memoryAdapter(database),secret:"isolated-email-test-secret-at-least-thirty-two-characters",baseURL:"http://localhost:3000",...createEmailAuthOptions(),rateLimit:{enabled:false},advanced:{disableOriginCheck:false,disableCSRFCheck:false},logger:{disabled:true}});
  return {service,database};
}
function linkIn(text:string,label:string){const line=text.split("\n").find(line=>line.startsWith(label+": "));if(!line)throw new Error("Missing CTA.");return new URL(line.slice(label.length+2));}
function sentEmail(subject:string){const call=mocks.send.mock.calls.find(([payload])=>payload.subject===subject);if(!call)throw new Error("Missing email: "+subject);return call[0];}

it("creates no session until the email is verified",async()=>{
  const {service,database}=setup();
  const account=await service.api.signUpEmail({body:{name:"Alex Seller",email:"seller@example.com",password:"test-password-123",callbackURL:"/verify-email"}});
  expect(account.user.emailVerified).toBe(false);
  expect(account.token).toBeNull();
  expect(database.session).toHaveLength(0);
  const verification=sentEmail("Verify your CarXSailor email");
  expect(verification.to).toBe("seller@example.com");
  const url=linkIn(verification.text,"Verify Email");
  expect(url.pathname).toBe("/api/auth/verify-email");
  expect(url.searchParams.get("callbackURL")).toBe("/verify-email");
  await expect(service.api.signInEmail({body:{email:"seller@example.com",password:"test-password-123"}})).rejects.toMatchObject({body:{code:"EMAIL_NOT_VERIFIED"}});
  expect(database.session).toHaveLength(0);
  const token=url.searchParams.get("token")!;
  expect(token.split(".")).toHaveLength(3);
  await expect(service.api.verifyEmail({query:{token}})).resolves.toMatchObject({status:true});
  expect(database.user[0].emailVerified).toBe(true);
  for(const task of mocks.tasks)await task();
  expect(mocks.send.mock.calls.some(([payload])=>payload.subject==="Welcome to CarXSailor")).toBe(true);
  await expect(service.api.signInEmail({body:{email:"seller@example.com",password:"test-password-123"}})).resolves.toHaveProperty("user");
});

it("resends a fresh verification link without creating a session",async()=>{
  const {service,database}=setup();
  await service.api.signUpEmail({body:{name:"Alex",email:"seller@example.com",password:"test-password-123",callbackURL:"/verify-email"}});
  const firstLink=linkIn(sentEmail("Verify your CarXSailor email").text,"Verify Email");
  await service.api.sendVerificationEmail({body:{email:"seller@example.com",callbackURL:"/verify-email"}});
  const verificationCalls=mocks.send.mock.calls.filter(([payload])=>payload.subject==="Verify your CarXSailor email");
  expect(verificationCalls).toHaveLength(2);
  const resentLink=linkIn(verificationCalls[1][0].text,"Verify Email");
  expect(firstLink.searchParams.get("token")).toBeTruthy();
  expect(resentLink.searchParams.get("token")).toBeTruthy();
  expect(resentLink.searchParams.get("callbackURL")).toBe("/verify-email");
  expect(database.session).toHaveLength(0);
});
it("issues a working password-reset link and rejects token reuse",async()=>{
  const {service,database}=setup();
  await service.api.signUpEmail({body:{name:"Alex",email:"seller@example.com",password:"original-password-123",callbackURL:"/verify-email"}});
  await service.api.requestPasswordReset({body:{email:"seller@example.com",redirectTo:"/reset-password"}});
  const url=linkIn(sentEmail("Reset your CarXSailor password").text,"Reset Password");
  expect(url.pathname).toMatch(/^\/api\/auth\/reset-password\/[^/]+$/);
  expect(url.searchParams.get("callbackURL")).toBe("/reset-password");
  const response=await service.handler(new Request(url));
  expect(response.status).toBe(302);
  const callback=new URL(response.headers.get("location")!,"http://localhost:3000");
  const token=callback.searchParams.get("token")!;
  expect(database.verification).toHaveLength(1);
  expect(JSON.stringify(database.verification)).not.toContain(token);
  await expect(service.api.resetPassword({body:{token,newPassword:"replacement-password-123"}})).resolves.toMatchObject({status:true});
  await expect(service.api.resetPassword({body:{token,newPassword:"another-password-123"}})).rejects.toBeDefined();
});

it("keeps a failed signup email from creating a session",async()=>{
  const {service,database}=setup();
  mocks.send.mockResolvedValue({data:null,error:{name:"validation_error"}});
  await expect(service.api.signUpEmail({body:{name:"Alex",email:"seller@example.com",password:"test-password-123",callbackURL:"/verify-email"}})).resolves.toMatchObject({token:null});
  expect(database.user).toHaveLength(1);
  expect(database.session).toHaveLength(0);
  await expect(service.api.signInEmail({body:{email:"seller@example.com",password:"test-password-123"}})).rejects.toMatchObject({body:{code:"EMAIL_NOT_VERIFIED"}});
  await expect(service.api.sendVerificationEmail({body:{email:"seller@example.com",callbackURL:"/verify-email"}})).rejects.toMatchObject({statusCode:503});
  await expect(service.api.requestPasswordReset({body:{email:"seller@example.com",redirectTo:"/reset-password"}})).rejects.toMatchObject({statusCode:503});
});

it("rejects external reset redirects and keeps unknown-account reset responses generic",async()=>{
  const {service}=setup();
  const invalid=await service.handler(new Request("http://localhost:3000/api/auth/request-password-reset",{method:"POST",headers:{"content-type":"application/json",origin:"http://localhost:3000"},body:JSON.stringify({email:"unknown@example.com",redirectTo:"https://evil.example.com/reset"})}));
  expect(invalid.status).toBe(403);
  await expect(service.api.requestPasswordReset({body:{email:"unknown@example.com",redirectTo:"/reset-password"}})).resolves.toMatchObject({status:true});
  expect(mocks.send).not.toHaveBeenCalled();
});