import {beforeEach,expect,it,vi} from "vitest";
import {Types} from "mongoose";
vi.mock("server-only",()=>({}));
vi.mock("./email/notifications",()=>({notifyListingOwner:vi.fn()}));
const mocks=vi.hoisted(()=>({upload:vi.fn(),remove:vi.fn(),create:vi.fn(),read:vi.fn(),invalidate:vi.fn()}));
vi.mock("./auth",()=>({getCurrentUser:async()=>({id:"seller",role:"BUYER"})}));
vi.mock("./db",()=>({connectMongoose:async()=>{}}));
vi.mock("./invalidation",()=>({invalidateInventory:mocks.invalidate,invalidateVendor:vi.fn()}));
vi.mock("./storage/provider",()=>({
  getImageStorageProvider:()=>({upload:mocks.upload,delete:mocks.remove}),
  validateVehicleImage:vi.fn(),
}));
vi.mock("@/models/VendorProfile",()=>({VendorProfileModel:{
  findOne:()=>({lean:async()=>({_id:"123456789012345678901234",status:"APPROVED",location:{state:"Lagos"}})}),
  distinct:async()=>["123456789012345678901234"],
}}));
vi.mock("@/models/Vehicle",()=>({VehicleModel:{
  create:mocks.create,
  findOne:()=>({lean:mocks.read}),
}}));
vi.mock("@/models/AuditLog",()=>({AuditLogModel:{}}));
import {createListing} from "./mutations";
import {notifyListingOwner} from "./email/notifications";
import {findActiveVehicleBySlug} from "./vehicles";

function form(){
  const data=new FormData();
  for(const [key,value]of Object.entries({make:"Toyota",model:"Corolla",year:"2024",price:"5000000",mileage:"1000",city:"Ikeja",transmission:"AUTOMATIC",description:"A car with three separate photos uploaded by its seller."}))data.set(key,value);
  for(const name of ["front","side","interior"])data.append("imageFile",new File(["photo-"+name],name+".jpg",{type:"image/jpeg"}));
  return data;
}
beforeEach(()=>{
  vi.resetAllMocks();
  mocks.upload.mockImplementation(async(file:File,options:{folder:string;alt:string})=>({
    url:"https://res.cloudinary.com/example/"+options.folder+"/"+file.name,
    publicId:options.folder+"/"+file.name,
    alt:options.alt,
  }));
  mocks.create.mockImplementation(async(row:Record<string,unknown>)=>{
    mocks.read.mockResolvedValue({...row,createdAt:new Date()});
    return row;
  });
  mocks.remove.mockResolvedValue(undefined);
});
it("saves every multipart photo on the same car and returns all of them to the gallery",async()=>{
  const result=await createListing(form());
  expect(mocks.upload).toHaveBeenCalledTimes(3);
  const stored=mocks.create.mock.calls[0][0];
  expect(stored._id).toBeInstanceOf(Types.ObjectId);
  expect(stored.images).toHaveLength(3);
  expect(stored.images.map((image:{order:number})=>image.order)).toEqual([0,1,2]);
  expect(stored.images.map((image:{isPrimary:boolean})=>image.isPrimary)).toEqual([true,false,false]);
  for(const [,options]of mocks.upload.mock.calls)expect(options.folder).toBe("123456789012345678901234/"+stored._id);
  const car=await findActiveVehicleBySlug(stored.slug);
  expect(car?.images).toEqual(stored.images);
  expect(car?.images.map(image=>image.url.split("/").pop())).toEqual(["front.jpg","side.jpg","interior.jpg"]);
  expect(result.destination).toBe("/vendor/cars/"+stored._id);
  expect(notifyListingOwner).toHaveBeenCalledWith("car-submitted",String(stored._id));
  expect(mocks.create.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(notifyListingOwner).mock.invocationCallOrder[0]);
  expect(mocks.invalidate.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(notifyListingOwner).mock.invocationCallOrder[0]);
});
it("does not create a partial-photo listing when an upload fails",async()=>{
  mocks.upload.mockResolvedValueOnce({url:"https://example.com/front.jpg",publicId:"car/front",alt:"front"}).mockRejectedValueOnce(new Error("Upload failed"));
  await expect(createListing(form())).rejects.toThrow("Upload failed");
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.remove).toHaveBeenCalledWith("car/front");
  expect(mocks.invalidate).not.toHaveBeenCalled();
  expect(notifyListingOwner).not.toHaveBeenCalled();
});
it("cleans up all uploaded files if saving the car fails",async()=>{
  mocks.create.mockRejectedValueOnce(new Error("Database unavailable"));
  await expect(createListing(form())).rejects.toThrow("Database unavailable");
  expect(mocks.remove).toHaveBeenCalledTimes(3);
  expect(mocks.invalidate).not.toHaveBeenCalled();
  expect(notifyListingOwner).not.toHaveBeenCalled();
});
