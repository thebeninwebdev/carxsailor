import {afterEach,beforeEach,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({after:vi.fn(),car:vi.fn(),vendor:vi.fn(),owner:vi.fn(),send:vi.fn()}));
vi.mock("next/server",()=>({after:mocks.after}));
vi.mock("@/lib/db",()=>({
  connectMongoose:vi.fn(),connectMongoClient:vi.fn(),
  authDatabase:{collection:()=>({findOne:mocks.owner})},
}));
vi.mock("@/models/Vehicle",()=>({VehicleModel:{findById:()=>({lean:mocks.car})}}));
vi.mock("@/models/VendorProfile",()=>({VendorProfileModel:{findById:()=>({lean:mocks.vendor})}}));
vi.mock("./send-email",()=>({sendTransactionalEmail:mocks.send}));
import {notifyListingOwner} from "./notifications";
beforeEach(()=>{
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL","https://app.example.com");
  mocks.car.mockResolvedValue({title:"2020 Toyota Camry",slug:"2020-toyota-camry",vendorId:"vendor"});
  mocks.vendor.mockResolvedValue({userId:"012345678901234567890123"});
  mocks.owner.mockResolvedValue({email:"owner@example.com",name:"Alex"});
  mocks.send.mockResolvedValue({success:true,id:"sent"});
  vi.spyOn(console,"error").mockImplementation(()=>{});
});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
it.each([
  ["car-approved","/cars/2020-toyota-camry"],
  ["car-submitted","/vendor/cars/listing"],
  ["car-rejected","/vendor/cars/listing"],
  ["car-resubmitted","/vendor/cars/listing"],
  ["inquiry","/vendor/inquiries"],
] as const)("resolves the listing owner's account and correct CTA for %s",async(kind,url)=>{
  notifyListingOwner(kind,"listing");
  expect(mocks.send).not.toHaveBeenCalled();
  await mocks.after.mock.calls[0][0]();
  expect(mocks.owner.mock.calls[0][0]._id.$in).toHaveLength(2);
  expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({to:"owner@example.com",template:kind}));
  expect(mocks.send.mock.calls[0][0].text).toContain("https://app.example.com"+url);
});
it("does not invent a rejection reason when no field exists on the listing",async()=>{
  notifyListingOwner("car-rejected","listing");
  await mocks.after.mock.calls[0][0]();
  expect(mocks.send.mock.calls[0][0].text).not.toContain("Reason:");
});
it("contains post-commit lookup failures without sending to a guessed owner",async()=>{
  mocks.owner.mockResolvedValue(null);
  notifyListingOwner("car-approved","listing");
  await expect(mocks.after.mock.calls[0][0]()).resolves.toBeUndefined();
  expect(mocks.send).not.toHaveBeenCalled();
  expect(console.error).toHaveBeenCalledWith("[Email] Notification failed",{template:"car-approved"});
});
