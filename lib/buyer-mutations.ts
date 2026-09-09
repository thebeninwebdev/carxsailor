import "server-only";
import {randomBytes} from "node:crypto";
import {z} from "zod";
import {notifyInquiryAdmin,notifyListingOwner} from "./email/notifications";
import {getCurrentUser} from "./auth";
import {connectMongoose} from "./db";
import {MutationError} from "./mutation-result";
import {invalidateGarage} from "./invalidation";
import {FavoriteModel} from "@/models/Favorite";
import {VehicleModel} from "@/models/Vehicle";
import {InquiryModel} from "@/models/Inquiry";
import {AdviserSessionModel} from "@/models/AdviserSession";
import {preferenceSchema} from "./dss/preferences";
import {recommend} from "./dss/recommend";
const idSchema=z.string().regex(/^[a-f\d]{24}$/i);
async function buyer(){
  const user=await getCurrentUser();
  if(!user) throw new MutationError("Sign in to continue.",401);
  if(user.role==="ADMIN")throw new MutationError("Admin accounts can only use the admin workspace.",403);
  await connectMongoose();
  return user;
}
export async function setFavorite(input:unknown){
  const user=await buyer();
  const parsed=z.object({vehicleId:idSchema,saved:z.boolean()}).safeParse(input);
  if(!parsed.success)throw new MutationError("Invalid vehicle.");
  const {vehicleId,saved}=parsed.data;
  if(saved){
    if(!await VehicleModel.exists({_id:vehicleId,status:"ACTIVE"}))throw new MutationError("This car is no longer available.",404);
    try{await FavoriteModel.updateOne({userId:user.id,vehicleId},{$setOnInsert:{userId:user.id,vehicleId}},{upsert:true});}
    catch(error){if(!(error instanceof Error&&"code" in error&&error.code===11000))throw error;}
  }else await FavoriteModel.deleteOne({userId:user.id,vehicleId});
  invalidateGarage("favorites");
  return {saved};
}
export async function sendInquiry(input:unknown){
  const user=await buyer();
  const parsed=z.object({vehicleId:idSchema,kind:z.enum(["AVAILABILITY","INSPECTION","VIEWING","QUESTION"]),message:z.string().trim().max(1500).transform(value=>value||"I am interested in this car.")}).safeParse(input);
  if(!parsed.success)throw new MutationError("Check the inquiry details.");
  const vehicle=await VehicleModel.findOne({_id:parsed.data.vehicleId,status:"ACTIVE"}).select("vendorId").lean();
  if(!vehicle)throw new MutationError("This car is no longer available.",404);
  if(await InquiryModel.exists({buyerId:user.id,vehicleId:parsed.data.vehicleId,createdAt:{$gte:new Date(Date.now()-600000)}}))throw new MutationError("Please wait before sending another inquiry for this car.",429);
  let inquiry;
  for(let attempt=0;attempt<3;attempt++){
    const reference="CX-INQ-"+randomBytes(5).toString("hex").toUpperCase();
    try{
      inquiry=await InquiryModel.create({...parsed.data,reference,buyerId:user.id,vendorId:String(vehicle.vendorId)});
      break;
    }catch(error){
      if(!(error instanceof Error&&"code" in error&&error.code===11000)||attempt===2)throw error;
    }
  }
  if(!inquiry)throw new Error("Inquiry reference could not be generated.");
  invalidateGarage("inquiries");
  notifyListingOwner("inquiry",parsed.data.vehicleId);
  notifyInquiryAdmin(String(inquiry._id));
  return {created:true,reference:String(inquiry.reference)};
}
export async function saveDecision(input:unknown){
  const user=await buyer();
  const parsed=preferenceSchema.safeParse(input);
  if(!parsed.success)throw new MutationError("Check your preferences before saving.");
  const preference={...parsed.data,hardConstraints:[],missingInformation:[],clarificationRequired:false};
  const result=await recommend(preference);
  const saved=await AdviserSessionModel.findOneAndUpdate({userId:user.id,preference},
    {$set:{preference,status:"COMPLETED",recommendations:result.recommendations?.map(r=>({vehicleId:r.vehicleId,score:r.score}))??[]}},
    {upsert:true,returnDocument:"after",runValidators:true});
  invalidateGarage("recommendations");
  return {id:String(saved._id)};
}
