import {afterEach,beforeEach,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({after:vi.fn(),car:vi.fn(),inquiry:vi.fn(),vendor:vi.fn(),owner:vi.fn(),send:vi.fn()}));
vi.mock("next/server",()=>({after:mocks.after}));
vi.mock("@/lib/db",()=>({connectMongoose:vi.fn(),connectMongoClient:vi.fn(),authDatabase:{collection:()=>({findOne:mocks.owner})}}));
vi.mock("@/models/Vehicle",()=>({VehicleModel:{findById:()=>({lean:mocks.car,select:()=>({lean:mocks.car})})}}));
vi.mock("@/models/Inquiry",()=>({InquiryModel:{findById:()=>({lean:mocks.inquiry})}}));
vi.mock("@/models/VendorProfile",()=>({VendorProfileModel:{findById:()=>({lean:mocks.vendor})}}));
vi.mock("./send-email",()=>({sendTransactionalEmail:mocks.send}));
import {notifyInquiryAdmin,notifyListingOwner} from "./notifications";
beforeEach(()=>{
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL","https://app.example.com");
  vi.stubEnv("ADMIN_NOTIFICATION_EMAIL","admin@example.com");
  mocks.car.mockResolvedValue({_id:"listing",title:"2020 Toyota Camry",slug:"2020-toyota-camry",price:15500000,vendorId:"vendor"});
  mocks.inquiry.mockResolvedValue({_id:"inquiry",reference:"CX-INQ-A83F2",buyerId:"012345678901234567890123",vehicleId:"listing",message:"<script>Interested</script>",createdAt:new Date("2026-09-09T10:00:00Z")});
  mocks.vendor.mockResolvedValue({userId:"012345678901234567890123"});
  mocks.owner.mockResolvedValue({email:"owner@example.com",name:"Alex"});
  mocks.send.mockResolvedValue({success:true,id:"sent"});
  vi.spyOn(console,"error").mockImplementation(()=>{});
});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
it.each([["car-approved","/cars/2020-toyota-camry"],["car-submitted","/vendor/cars/listing"],["car-rejected","/vendor/cars/listing"],["car-resubmitted","/vendor/cars/listing"],["inquiry","/vendor/inquiries"]] as const)("resolves the listing owner's account and correct CTA for %s",async(kind,url)=>{
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
});it("sends the admin a post-save inquiry notification with full context",async()=>{
  notifyInquiryAdmin("inquiry");
  expect(mocks.send).not.toHaveBeenCalled();
  await mocks.after.mock.calls[0][0]();
  const email=mocks.send.mock.calls[0][0];
  expect(email).toMatchObject({to:"admin@example.com",replyTo:"owner@example.com",template:"admin-inquiry",idempotencyKey:"admin-inquiry-inquiry"});
  expect(email.subject).toContain("2020 Toyota Camry");
  expect(email.text).toContain("CX-INQ-A83F2");
  expect(email.text).toContain("₦15,500,000");
  expect(email.text).toContain("https://app.example.com/admin/inquiries#inquiry-CX-INQ-A83F2");
  expect(email.html).not.toContain("<script>Interested</script>");
  expect(email.html).toContain("&lt;script&gt;Interested&lt;/script&gt;");
});
it("contains post-commit lookup failures",async()=>{
  mocks.owner.mockResolvedValue(null);
  notifyListingOwner("car-approved","listing");
  await expect(mocks.after.mock.calls[0][0]()).resolves.toBeUndefined();
  expect(mocks.send).not.toHaveBeenCalled();
  expect(console.error).toHaveBeenCalledWith("[Email] Notification failed",{template:"car-approved"});
});