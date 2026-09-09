import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({mutate:vi.fn(),user:vi.fn(),destination:vi.fn(),invalidate:vi.fn(),redirect:vi.fn()}));
vi.mock("./mutations",()=>({mutations:{moderate:mocks.mutate}}));
vi.mock("./auth",()=>({getCurrentUser:mocks.user,getPostLoginDestination:mocks.destination}));
vi.mock("next/cache",()=>({revalidatePath:mocks.invalidate}));
vi.mock("next/navigation",()=>({redirect:mocks.redirect}));
import {runMutation,completeSignIn,completeSignOut} from "./actions";
import {MutationError} from "./mutation-result";
beforeEach(()=>{
  vi.clearAllMocks();
  mocks.redirect.mockImplementation((path:string)=>{throw new Error("NEXT_REDIRECT:"+path);});
  mocks.user.mockResolvedValue({id:"user",role:"BUYER"});
  mocks.destination.mockResolvedValue("/dashboard/favorites");
});
describe("action completion",()=>{
  it("returns mutation failures without invalidation or navigation",async()=>{
    mocks.mutate.mockRejectedValueOnce(new MutationError("Listing changed.",409));
    await expect(runMutation("moderate",{},new FormData())).resolves.toEqual({error:"Listing changed."});
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("does not swallow the successful Next.js redirect",async()=>{
    mocks.mutate.mockResolvedValueOnce({destination:"/admin/cars?status=ACTIVE",message:"Car approved successfully."});
    await expect(runMutation("moderate",{},new FormData())).rejects.toThrow("NEXT_REDIRECT:/admin/cars?status=ACTIVE&notice=");
  });
  it("refuses login navigation without a confirmed server session",async()=>{
    mocks.user.mockResolvedValueOnce(undefined);
    await expect(completeSignIn("/dashboard")).resolves.toHaveProperty("error");
    expect(mocks.redirect).not.toHaveBeenCalled();expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it("invalidates authenticated layout state before returning to the intended page",async()=>{
    await expect(completeSignIn("/dashboard/favorites")).rejects.toThrow("NEXT_REDIRECT:/dashboard/favorites");
    expect(mocks.destination).toHaveBeenCalledWith({id:"user",role:"BUYER"},"/dashboard/favorites");
    expect(mocks.invalidate).toHaveBeenCalledWith("/","layout");
    expect(mocks.invalidate.mock.invocationCallOrder[0]).toBeLessThan(mocks.redirect.mock.invocationCallOrder[0]);
  });
  it("does not claim sign-out while a session exists",async()=>{
    await expect(completeSignOut()).resolves.toHaveProperty("error");expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("invalidates and redirects after sign-out is confirmed",async()=>{
    mocks.user.mockResolvedValueOnce(undefined);
    await expect(completeSignOut()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(mocks.invalidate).toHaveBeenCalledWith("/","layout");
  });
});
