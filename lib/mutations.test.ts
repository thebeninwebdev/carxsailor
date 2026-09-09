import {beforeEach,describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
vi.mock("./email/notifications",()=>({notifyListingOwner:vi.fn()}));
const mocks=vi.hoisted(()=>({
  user:vi.fn(),car:vi.fn(),vendorExists:vi.fn(),update:vi.fn(),audit:vi.fn(),invalidate:vi.fn(),
}));
vi.mock("./auth",()=>({getCurrentUser:mocks.user}));
vi.mock("./db",()=>({connectMongoose:vi.fn()}));
vi.mock("./invalidation",()=>({invalidateInventory:mocks.invalidate,invalidateVendor:vi.fn()}));
vi.mock("./storage/provider",()=>({getImageStorageProvider:vi.fn(),validateVehicleImage:vi.fn()}));
vi.mock("mongoose",()=>({default:{connection:{transaction:async(fn:(session:object)=>Promise<void>)=>fn({})}}}));
vi.mock("@/models/Vehicle",()=>({VehicleModel:{
  findById:()=>({session:()=>({lean:mocks.car})}),updateOne:mocks.update,
}}));
vi.mock("@/models/VendorProfile",()=>({VendorProfileModel:{exists:()=>({session:mocks.vendorExists})}}));
vi.mock("@/models/AuditLog",()=>({AuditLogModel:{create:mocks.audit}}));
import {moderate} from "./mutations";
import {notifyListingOwner} from "./email/notifications";
import {scheduleNotification} from "./email/schedule";
const afterResponse=vi.hoisted(()=>vi.fn());
vi.mock("next/server",()=>({after:afterResponse}));
function form(id="123456789012345678901234"){
  const value=new FormData();value.set("targetType","VEHICLE");value.set("targetId",id);value.set("action","APPROVE_LISTING");return value;
}
beforeEach(()=>{
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({id:"admin",role:"ADMIN"});
  mocks.car.mockResolvedValue({status:"PENDING_REVIEW",images:[{url:"image"}],vendorId:"seller",updatedAt:new Date(0)});
  mocks.vendorExists.mockResolvedValue({_id:"seller"});
  mocks.update.mockResolvedValue({modifiedCount:1});
  mocks.audit.mockResolvedValue([]);
});
describe("approval mutation",()=>{
  it("confirms the write, audit and invalidation before returning the approved destination",async()=>{
    const result=await moderate(form());
    expect(mocks.update.mock.calls[0][1].$set.status).toBe("ACTIVE");
    expect(mocks.update.mock.calls[0][1].$set.publishedAt).toBeInstanceOf(Date);
    expect(mocks.audit).toHaveBeenCalledOnce();
    expect(mocks.invalidate).toHaveBeenCalledOnce();
    expect(notifyListingOwner).toHaveBeenCalledWith("car-approved","123456789012345678901234");
    expect(mocks.audit.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(notifyListingOwner).mock.invocationCallOrder[0]);
    expect(mocks.invalidate.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(notifyListingOwner).mock.invocationCallOrder[0]);
    expect(result.destination).toBe("/admin/cars?status=ACTIVE");
  });
  it.each([undefined,{id:"buyer",role:"BUYER"}])("rejects unauthorized callers",async user=>{
    mocks.user.mockResolvedValue(user);
    await expect(moderate(form())).rejects.toMatchObject({status:user?403:401});
    expect(mocks.update).not.toHaveBeenCalled();expect(notifyListingOwner).not.toHaveBeenCalled();
  });
  it("validates IDs",async()=>{await expect(moderate(form("bad"))).rejects.toMatchObject({status:422});expect(mocks.update).not.toHaveBeenCalled();expect(notifyListingOwner).not.toHaveBeenCalled();});
  it("rejects nonexistent listings",async()=>{mocks.car.mockResolvedValue(null);await expect(moderate(form())).rejects.toMatchObject({status:404});expect(mocks.audit).not.toHaveBeenCalled();});
  it("rejects sellers that are not approved",async()=>{mocks.vendorExists.mockResolvedValue(null);await expect(moderate(form())).rejects.toMatchObject({status:409});expect(mocks.update).not.toHaveBeenCalled();expect(notifyListingOwner).not.toHaveBeenCalled();});
  it("never reports a lost update as success",async()=>{mocks.update.mockResolvedValue({modifiedCount:0});await expect(moderate(form())).rejects.toMatchObject({status:409});expect(mocks.audit).not.toHaveBeenCalled();expect(mocks.invalidate).not.toHaveBeenCalled();expect(notifyListingOwner).not.toHaveBeenCalled();});
  it("does not invalidate or navigate after database failure",async()=>{mocks.update.mockRejectedValueOnce(new Error("database failed"));await expect(moderate(form())).rejects.toThrow("database failed");expect(mocks.invalidate).not.toHaveBeenCalled();expect(notifyListingOwner).not.toHaveBeenCalled();});
});

it("does not send approval when the transaction audit fails",async()=>{
  mocks.audit.mockRejectedValueOnce(new Error("audit failed"));
  await expect(moderate(form())).rejects.toThrow("audit failed");
  expect(notifyListingOwner).not.toHaveBeenCalled();
});
it("sends rejection only after the rejection is saved",async()=>{
  const input=form();input.set("action","REJECT_LISTING");
  const result=await moderate(input);
  expect(result.destination).toBe("/admin/cars?status=REJECTED");
  expect(notifyListingOwner).toHaveBeenCalledWith("car-rejected","123456789012345678901234");
  expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(notifyListingOwner).mock.invocationCallOrder[0]);
});
it("keeps a successful approval when the notification fails after the response",async()=>{
  const error=vi.spyOn(console,"error").mockImplementation(()=>{});
  vi.mocked(notifyListingOwner).mockImplementationOnce(()=>scheduleNotification("car-approved",async()=>{throw new Error("Resend failed");}));
  const result=await moderate(form());
  expect(result.destination).toBe("/admin/cars?status=ACTIVE");
  await expect(afterResponse.mock.calls[0][0]()).resolves.toBeUndefined();
  expect(mocks.update).toHaveBeenCalledOnce();
  expect(mocks.update.mock.calls[0][1].$set.status).toBe("ACTIVE");
  error.mockRestore();
});
