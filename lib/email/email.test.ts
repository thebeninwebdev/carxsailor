import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({send:vi.fn()}));
vi.mock("./resend",()=>({getResendClient:()=>({emails:{send:mocks.send}})}));
import {adminNotificationEmail,appUrl,emailConfig,getEmailRecipient} from "./config";
import {renderEmail} from "./templates";
import {sendTransactionalEmail} from "./send-email";
import {sendAuthEmail} from "./auth-emails";
beforeEach(()=>{
  vi.stubEnv("EMAIL_FROM","");vi.stubEnv("EMAIL_FROM_NAME","CarXSailor");vi.stubEnv("EMAIL_FROM_ADDRESS","noreply@swiftdu.example");
  vi.spyOn(console,"info").mockImplementation(()=>{});vi.spyOn(console,"error").mockImplementation(()=>{});
  mocks.send.mockReset().mockResolvedValue({data:{id:"email-id"},error:null});
});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
const rendered=()=>renderEmail({kind:"welcome",name:"Alex",url:"http://localhost:3000/cars"});
describe("email routing",()=>{
  it("uses the verified split sender variables and the real recipient",async()=>{
    expect(await sendTransactionalEmail({to:"seller@example.com",template:"welcome",...rendered()})).toEqual({success:true,id:"email-id"});
    expect(mocks.send.mock.calls[0][0]).toMatchObject({from:"CarXSailor <noreply@swiftdu.example>",to:"seller@example.com",subject:"Welcome to CarXSailor"});
    expect(mocks.send.mock.calls[0][0].html).not.toContain("Intended recipient");
    expect(console.info).toHaveBeenCalledWith("[Email]",{template:"welcome",resendId:"email-id"});
  });
  it("uses the verified sender address as the admin inbox fallback",()=>expect(adminNotificationEmail({EMAIL_FROM_ADDRESS:"admin@swiftdu.example"})).toBe("admin@swiftdu.example"));
  it("supports the original combined sender variable",()=>{
    expect(emailConfig({EMAIL_FROM:"CarXSailor <noreply@verified.example.com>"}).from).toBe("CarXSailor <noreply@verified.example.com>");
  });
  it("rejects invalid recipients before calling Resend",async()=>{
    expect((await sendTransactionalEmail({to:"invalid",template:"welcome",...rendered()})).success).toBe(false);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each(["CarXSailor <onboarding@resend.dev>","CarXSailor onboarding@resend.dev"])("normalizes sender syntax: %s",EMAIL_FROM=>{
    expect(emailConfig({EMAIL_FROM}).from).toBe("CarXSailor <onboarding@resend.dev>");
  });
  it("rejects sender header injection and external application links",()=>{
    expect(()=>emailConfig({EMAIL_FROM:"Brand\r\nBcc: attacker@example.com"})).toThrow();
    expect(()=>appUrl("//evil.example.com")).toThrow();expect(()=>appUrl("/\\evil.example.com")).toThrow();
    expect(appUrl("/vendor/cars/123",{NEXT_PUBLIC_APP_URL:"https://preview.example.com"})).toBe("https://preview.example.com/vendor/cars/123");
    expect(getEmailRecipient("seller@example.com")).toBe("seller@example.com");
  });
});
describe("failure handling and secure content",()=>{
  it.each([{data:null,error:{name:"validation_error",message:"private-provider-data"}},{data:null,error:null}])("treats an error result or absent provider ID as failure",async response=>{
    mocks.send.mockResolvedValue(response);expect((await sendTransactionalEmail({to:"seller@example.com",template:"welcome",...rendered()})).success).toBe(false);expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private-provider-data");
  });
  it("catches network exceptions without exposing their contents",async()=>{
    mocks.send.mockRejectedValue(new Error("secret-token-and-key"));expect((await sendTransactionalEmail({to:"seller@example.com",template:"welcome",...rendered()})).success).toBe(false);expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("secret-token-and-key");
  });
  it("preserves secure auth URLs and fails required dispatch with a safe API error",async()=>{
    const url="https://app.example.com/api/auth/verify-email?token=secret-token&callbackURL=%2Fverify-email";await sendAuthEmail("verification",{user:{email:"seller@example.com",name:"Alex"},url});expect(mocks.send.mock.calls[0][0].text).toContain(url);expect(mocks.send.mock.calls[0][0].html).toContain(url.replace("&","&amp;"));expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain("secret-token");mocks.send.mockResolvedValue({data:null,error:{name:"validation_error"}});await expect(sendAuthEmail("password-reset",{user:{email:"seller@example.com"},url})).rejects.toMatchObject({statusCode:503,body:{code:"EMAIL_DELIVERY_FAILED"}});
  });
  it("escapes names, titles, and optional rejection reasons",()=>{
    const email=renderEmail({kind:"car-rejected",name:"<script>",title:'Car <img src=x onerror="bad">',reference:"123",reason:"<script>alert(1)</script>"});expect(email.html).not.toContain("<script>");expect(email.html).not.toContain("<img");expect(email.text).toContain("Reason: <script>alert(1)</script>");expect(email.html).toContain("&lt;script&gt;");
  });
});