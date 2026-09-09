import {afterEach,beforeEach,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({after:vi.fn()}));
vi.mock("next/server",()=>({after:mocks.after}));
import {scheduleNotification} from "./schedule";
beforeEach(()=>{mocks.after.mockReset();vi.spyOn(console,"error").mockImplementation(()=>{});});
afterEach(()=>vi.restoreAllMocks());
it("does not run before the response and catches post-response notification failures",async()=>{
  const task=vi.fn().mockRejectedValue(new Error("provider failed"));
  scheduleNotification("car-approved",task);
  expect(task).not.toHaveBeenCalled();
  await expect(mocks.after.mock.calls[0][0]()).resolves.toBeUndefined();
  expect(task).toHaveBeenCalledOnce();
  expect(console.error).toHaveBeenCalledWith("[Email] Notification failed",{template:"car-approved"});
});
it("does not throw into successful mutations if scheduling is unavailable",()=>{
  mocks.after.mockImplementation(()=>{throw new Error("no request scope");});
  expect(()=>scheduleNotification("car-approved",async()=>{})).not.toThrow();
});
