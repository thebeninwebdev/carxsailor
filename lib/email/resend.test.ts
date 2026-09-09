import {afterEach,beforeEach,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
const construct=vi.hoisted(()=>vi.fn());
vi.mock("resend",()=>({Resend:class {constructor(key:string){construct(key);}}}));
beforeEach(()=>{vi.resetModules();construct.mockReset();});
afterEach(()=>vi.unstubAllEnvs());
it("fails safely without credentials and initializes one reusable client once configured",async()=>{
  vi.stubEnv("RESEND_API_KEY","");
  const {getResendClient}=await import("./resend");
  expect(()=>getResendClient()).toThrow("RESEND_API_KEY");
  expect(construct).not.toHaveBeenCalled();
  vi.stubEnv("RESEND_API_KEY","test-placeholder-not-a-real-key");
  expect(getResendClient()).toBe(getResendClient());
  expect(construct).toHaveBeenCalledOnce();
});
