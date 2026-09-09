import "server-only";
import {randomUUID} from "node:crypto";
import {notifyListingOwner} from "./email/notifications";
import mongoose from "mongoose";
import {z} from "zod";
import {getCurrentUser} from "./auth";
import {connectMongoose} from "./db";
import {MutationError, type MutationKind, type MutationSuccess} from "./mutation-result";
import {listingActions, listingTransition} from "./moderation";
import {invalidateInventory, invalidateVendor} from "./invalidation";
import {VehicleModel} from "@/models/Vehicle";
import {VendorProfileModel} from "@/models/VendorProfile";
import {AuditLogModel} from "@/models/AuditLog";
import {getImageStorageProvider, validateVehicleImage} from "./storage/provider";
import type {VehicleStatus} from "@/types";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid listing ID.");
export const listingSchema = z.object({
  make:z.string().trim().min(2).max(60), model:z.string().trim().min(1).max(60),
  year:z.coerce.number().int().min(1950).max(new Date().getFullYear()+1),
  price:z.coerce.number().positive(), mileage:z.coerce.number().nonnegative(),
  city:z.string().trim().min(2).max(60), transmission:z.enum(["AUTOMATIC","MANUAL","CVT","OTHER"]),
  description:z.string().trim().min(30).max(5000),
});
const vendorSchema = z.object({
  displayName:z.string().trim().min(2).max(100), businessName:z.string().trim().max(120).optional(),
  phoneNumber:z.string().trim().min(7).max(30), state:z.string().trim().min(2).max(60),
  city:z.string().trim().min(2).max(60), description:z.string().trim().max(1000).optional(),
});
function parse<T>(schema:z.ZodType<T>, value:unknown):T {
  const result=schema.safeParse(value);
  if(!result.success) throw new MutationError(result.error.issues.map(issue=>issue.path.join(".")+": "+issue.message).join(" "));
  return result.data;
}
async function actor() {
  const user=await getCurrentUser();
  if(!user) throw new MutationError("Your session has expired. Sign in again before submitting.",401);
  await connectMongoose();
  return user;
}
async function seller() {
  const user=await actor();
  if(user.role==="ADMIN") throw new MutationError("Use the admin workspace to moderate listings.",403);
  const vendor=await VendorProfileModel.findOne({userId:user.id,status:"APPROVED"}).lean();
  if(!vendor) throw new MutationError("An approved seller account is required.",403);
  return {user,vendor};
}
export async function moderate(form:FormData):Promise<MutationSuccess> {
  const user=await actor();
  if(user.role!=="ADMIN") throw new MutationError("Administrator access is required.",403);
  const input=parse(z.object({targetType:z.enum(["VEHICLE","VENDOR"]),targetId:objectId,
    action:z.enum([...listingActions,"APPROVE_VENDOR","REJECT_VENDOR","SUSPEND_VENDOR"])}),Object.fromEntries(form));
  const {targetType,targetId,action}=input;
  let destination="";
  let message="";
  await mongoose.connection.transaction(async session=>{
    if(targetType==="VEHICLE") {
      if(!listingActions.includes(action as typeof listingActions[number])) throw new MutationError("Invalid listing action.");
      const car=await VehicleModel.findById(targetId).session(session).lean();
      if(!car) throw new MutationError("Listing not found.",404);
      const update=listingTransition(car.status as VehicleStatus,action as typeof listingActions[number],car.isFeatured);
      if(action==="APPROVE_LISTING") {
        if(!car.images?.length) throw new MutationError("Add an image before approving this listing.",409);
        if(!await VendorProfileModel.exists({_id:car.vendorId,status:"APPROVED"}).session(session)) throw new MutationError("The seller must be approved before this listing can go live.",409);
      }
      const result=await VehicleModel.updateOne({_id:targetId,status:car.status,updatedAt:car.updatedAt},
        {$set:{...update,...(action==="APPROVE_LISTING"?{publishedAt:new Date()}: {})}}, {session,runValidators:true});
      if(result.modifiedCount!==1) throw new MutationError("The listing changed. Reload it and try again.",409);
      destination="/admin/cars?status="+update.status;
      message=action==="APPROVE_LISTING"?"Car approved successfully.":action==="REJECT_LISTING"?"Car rejected successfully.":action==="SUSPEND_LISTING"?"Car suspended successfully.":"Featured status updated.";
    } else {
      if(!["APPROVE_VENDOR","REJECT_VENDOR","SUSPEND_VENDOR"].includes(action)) throw new MutationError("Invalid vendor action.");
      const vendor=await VendorProfileModel.findById(targetId).session(session).lean();
      if(!vendor) throw new MutationError("Seller not found.",404);
      const status=action==="APPROVE_VENDOR"?"APPROVED":action==="REJECT_VENDOR"?"REJECTED":"SUSPENDED";
      if(vendor.status===status || (action==="SUSPEND_VENDOR"?vendor.status!=="APPROVED":vendor.status==="APPROVED")) throw new MutationError("This seller status does not allow that action.",409);
      const result=await VendorProfileModel.updateOne({_id:targetId,status:vendor.status},{$set:{status}}, {session,runValidators:true});
      if(result.modifiedCount!==1) throw new MutationError("The seller changed. Reload and try again.",409);
      if(status==="SUSPENDED") await VehicleModel.updateMany({vendorId:vendor._id,status:"ACTIVE"},{$set:{status:"SUSPENDED",isFeatured:false}},{session,runValidators:true});
      destination="/admin/vendors/"+targetId;
      message="Seller status updated successfully.";
    }
    await AuditLogModel.create([{actorId:user.id,action,targetType,targetId}],{session});
  });
  if(targetType==="VEHICLE") invalidateInventory(); else invalidateVendor();
  if(targetType==="VEHICLE" && action==="APPROVE_LISTING") notifyListingOwner("car-approved",targetId);
  if(targetType==="VEHICLE" && action==="REJECT_LISTING") notifyListingOwner("car-rejected",targetId);
  return {destination,message};
}
export async function createListing(form:FormData):Promise<MutationSuccess> {
  const {vendor}=await seller();
  const v=parse(listingSchema,Object.fromEntries(form));
  const imageUrl=parse(z.union([z.literal(""),z.url({protocol:/https?/})]),form.get("imageUrl")??"");
  const files=form.getAll("imageFile").filter((file):file is File=>file instanceof File&&file.size>0);
  if(files.length>10) throw new MutationError("Upload at most 10 images per listing.");
  if(imageUrl&&files.length) throw new MutationError("Choose an image link or a file, not both.");
  if(!imageUrl&&!files.length) throw new MutationError("Add an image link or upload an image.");
  try{files.forEach(validateVehicleImage);}catch(error){throw new MutationError(error instanceof Error?error.message:"Invalid image.");}
  const title=`${v.year} ${v.make} ${v.model}`;
  const vehicleId=new mongoose.Types.ObjectId();
  const images:{url:string;alt:string;publicId?:string}[]=[];
  const storage=getImageStorageProvider();
  let id:string;
  try {
    for(const file of files) {validateVehicleImage(file);images.push(await storage.upload(file,{folder:String(vendor._id)+"/"+String(vehicleId),alt:title}));}
    if(imageUrl) images.push({url:imageUrl,alt:title});
    const {city,...details}=v;
    const created=await VehicleModel.create({_id:vehicleId,...details,vendorId:vendor._id,title,
      slug:(title+"-"+randomUUID()).toLowerCase().replace(/[^a-z0-9]+/g,"-"),
      location:{country:"Nigeria",state:vendor.location?.state,city},fuelType:"PETROL",bodyType:"OTHER",
      images:images.map((image,order)=>({...image,isPrimary:order===0,order})),
      features:[],status:"PENDING_REVIEW",inspectionStatus:"NOT_INSPECTED"});
    id=String(created._id);
  } catch(error) {
    const cleanup=await Promise.allSettled(images.flatMap(image=>image.publicId?[storage.delete(image.publicId)]:[]));
    if(cleanup.some(result=>result.status==="rejected")) console.error("[createListing] Image cleanup failed");
    throw error;
  }
  invalidateInventory();
  notifyListingOwner("car-submitted",id);
  return {destination:"/vendor/cars/"+id,message:"Listing submitted for admin review."};
}
export async function editListing(form:FormData):Promise<MutationSuccess> {
  const {vendor}=await seller();
  const id=parse(objectId,form.get("id"));
  const v=parse(listingSchema,Object.fromEntries(form));
  const car=await VehicleModel.findOne({_id:id,vendorId:vendor._id}).lean();
  if(!car) throw new MutationError("Listing not found.",404);
  if(!["DRAFT","REJECTED","PENDING_REVIEW","ACTIVE","SUSPENDED"].includes(car.status)) throw new MutationError("This listing cannot be edited in its current status.",409);
  const {city,...details}=v;
  const result=await VehicleModel.updateOne({_id:id,vendorId:vendor._id,updatedAt:car.updatedAt},
    {$set:{...details,title:`${v.year} ${v.make} ${v.model}`,"location.city":city,status:"PENDING_REVIEW",isFeatured:false}},
    {runValidators:true});
  if(result.matchedCount!==1) throw new MutationError("The listing changed. Reload and try again.",409);
  invalidateInventory();
  if(car.status!=="PENDING_REVIEW") notifyListingOwner("car-resubmitted",id);
  return {destination:"/vendor/cars/"+id,message:"Listing updated and submitted for review."};
}
export async function submitListing(form:FormData):Promise<MutationSuccess> {
  const {vendor}=await seller();
  const id=parse(objectId,form.get("id"));
  const result=await VehicleModel.updateOne({_id:id,vendorId:vendor._id,status:"DRAFT","images.0":{$exists:true}},
    {$set:{status:"PENDING_REVIEW"}},{runValidators:true});
  if(result.modifiedCount!==1) throw new MutationError("Only your draft listings with an image can be submitted.",409);
  invalidateInventory();
  notifyListingOwner("car-submitted",id);
  return {destination:"/vendor/cars/"+id,message:"Listing submitted for admin review."};
}
export async function applyVendor(form:FormData):Promise<MutationSuccess> {
  const user=await actor();
  if(user.role==="ADMIN") throw new MutationError("Administrators manage sellers from the admin workspace.",403);
  const {state,city,...details}=parse(vendorSchema,Object.fromEntries(form));
  await VendorProfileModel.updateOne({userId:user.id},{$setOnInsert:{...details,userId:user.id,status:"PENDING",location:{state,city}}},{upsert:true,runValidators:true});
  invalidateVendor();
  return {destination:"/vendor",message:"Seller application received."};
}
export async function updateProfile(form:FormData):Promise<MutationSuccess> {
  const {vendor}=await seller();
  const details=parse(z.object({displayName:z.string().trim().min(2).max(100),description:z.string().trim().max(1000)}),Object.fromEntries(form));
  const result=await VendorProfileModel.updateOne({_id:vendor._id,status:"APPROVED"},{$set:details},{runValidators:true});
  if(result.matchedCount!==1) throw new MutationError("Seller account changed. Reload and try again.",409);
  invalidateVendor();
  return {destination:"/vendor/profile",message:"Seller profile updated."};
}
export const mutations:Record<MutationKind,(form:FormData)=>Promise<MutationSuccess>>={moderate,createListing,editListing,submitListing,applyVendor,updateProfile};
