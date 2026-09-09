import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({send:vi.fn()}));
vi.mock("./resend",()=>({getResendClient:()=>({emails:{send:mocks.send}})}));
import {appUrl,emailConfig,getEmailRecipient} from "./config";
import {renderEmail} from "./templates";
import {sendTransactionalEmail} from "./send-email";
import {sendAuthEmail} from "./auth-emails";

beforeEach(()=>{
  vi.stubEnv("NODE_ENV","development");
  vi.stubEnv("VERCEL_ENV","");
  vi.stubEnv("EMAIL_FROM","");
  vi.stubEnv("RESEND_TEST_EMAIL","developer@example.com");
  vi.spyOn(console,"info").mockImplementation(()=>{});
  vi.spyOn(console,"error").mockImplementation(()=>{});
  mocks.send.mockReset().mockResolvedValue({data:{id:"email-id"},error:null});
});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
const rendered=()=>renderEmail({kind:"welcome",name:"Alex",url:"http://localhost:3000/cars"});
describe("email routing",()=>{
  it("overrides arbitrary users in development, labels mail, and logs only safe context",async()=>{
    const result=await sendTransactionalEmail({to:"seller@example.com",template:"welcome",...rendered()});
    expect(result).toEqual({success:true,id:"email-id"});
    expect(mocks.send.mock.calls[0][0]).toMatchObject({from:"CarXSailor <onboarding@resend.dev>",to:"developer@example.com",subject:"[TEST] Welcome to CarXSailor"});
    expect(mocks.send.mock.calls[0][0].html).toContain("Intended recipient: seller@example.com");
    expect(console.info).toHaveBeenCalledWith("[Email]",expect.objectContaining({intendedRecipient:"seller@example.com",actualRecipient:"developer@example.com"}));
  });
  it.each(["","invalid-email"])("fails closed if the test recipient is missing or invalid (%s)",async testEmail=>{
    vi.stubEnv("RESEND_TEST_EMAIL",testEmail);
    expect((await sendTransactionalEmail({to:"seller@example.com",template:"welcome",...rendered()})).success).toBe(false);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("[Email] Send failed",expect.objectContaining({message:expect.stringContaining("RESEND_TEST_EMAIL")}));
  });
  it("uses actual recipients and omits development information in production",async()=>{
    vi.stubEnv("NODE_ENV","production");vi.stubEnv("EMAIL_FROM","CarXSailor noreply@verified.example.com");
    await sendTransactionalEmail({to:"seller@example.com",template:"welcome",...rendered()});
    expect(mocks.send.mock.calls[0][0]).toMatchObject({from:"CarXSailor <noreply@verified.example.com>",to:"seller@example.com",subject:"Welcome to CarXSailor"});
    expect(mocks.send.mock.calls[0][0].html).not.toContain("Intended recipient");
    expect(console.info).toHaveBeenCalledWith("[Email]",{template:"welcome",resendId:"email-id"});
  });
  it("keeps Vercel previews restricted even with a verified sender",()=>{
    expect(getEmailRecipient("seller@example.com",{NODE_ENV:"production",VERCEL_ENV:"preview",EMAIL_FROM:"CarXSailor <noreply@verified.example.com>",RESEND_TEST_EMAIL:"developer@example.com"})).toBe("developer@example.com");
  });
  it("keeps an onboarding sender restricted on production deployments",()=>{
    expect(emailConfig({NODE_ENV:"production",VERCEL_ENV:"production"}).testMode).toBe(true);
  });
  it.each(["CarXSailor <onboarding@resend.dev>","CarXSailor onboarding@resend.dev"])("normalizes sender syntax: %s",EMAIL_FROM=>{
    expect(emailConfig({EMAIL_FROM}).from).toBe("CarXSailor <onboarding@resend.dev>");
  });
  it("rejects sender header injection and external application links",()=>{
    expect(()=>emailConfig({EMAIL_FROM:"Brand\r\nBcc: attacker@example.com"})).toThrow();
    expect(()=>appUrl("//evil.example.com")).toThrow();
    expect(()=>appUrl("/\\evil.example.com")).toThrow();
    expect(appUrl("/vendor/cars/123",{NEXT_PUBLIC_APP_URL:"https://preview.example.com"})).toBe("https://preview.example.com/vendor/cars/123");
  });
});
describe("failure handling and secure content",()=>{
  it.each([
    {data:null,error:{name:"validation_error",message:"private-provider-data"}},
    {data:null,error:null},
  ])("treats an error result or absent provider ID as failure",async response=>{
    mocks.send.mockResolvedValue(response);
    expect((await sendTransactionalEmail({to:"seller@example.com",template:"welcome",...rendered()})).success).toBe(false);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private-provider-data");
  });
  it("catches network exceptions without exposing their contents",async()=>{
    mocks.send.mockRejectedValue(new Error("secret-token-and-key"));
    expect((await sendTransactionalEmail({to:"seller@example.com",template:"welcome",...rendered()})).success).toBe(false);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("secret-token-and-key");
  });
  it("preserves secure auth URLs and fails required dispatch with a safe API error",async()=>{
    const url="https://app.example.com/api/auth/verify-email?token=secret-token&callbackURL=%2Fverify-email";
    await sendAuthEmail("verification",{user:{email:"seller@example.com",name:"Alex"},url});
    expect(mocks.send.mock.calls[0][0].text).toContain(url);
    expect(mocks.send.mock.calls[0][0].html).toContain(url.replace("&","&amp;"));
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain("secret-token");
    mocks.send.mockResolvedValue({data:null,error:{name:"validation_error"}});
    await expect(sendAuthEmail("password-reset",{user:{email:"seller@example.com"},url})).rejects.toMatchObject({statusCode:503,body:{code:"EMAIL_DELIVERY_FAILED"}});
  });
  it("escapes names, titles, and optional rejection reasons",()=>{
    const email=renderEmail({kind:"car-rejected",name:"<script>",title:'Car <img src=x onerror="bad">',reference:"123",reason:"<script>alert(1)</script>"});
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img");
    expect(email.text).toContain("Reason: <script>alert(1)</script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
