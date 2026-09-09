import "server-only";
import {connectMongoose} from "@/lib/db";
import {VehicleModel} from "@/models/Vehicle";
import {VendorProfileModel} from "@/models/VendorProfile";
import type {Vehicle} from "@/types";
type Row=Record<string,unknown>&{_id:unknown;vendorId:unknown;createdAt?:Date};
function serialize(row:Row):Vehicle{
  return JSON.parse(JSON.stringify({...row,condition:row.condition??{},features:row.features??[],images:row.images??[],isDemo:!!row.seedTag,id:String(row._id),vendorId:String(row.vendorId),createdAt:row.createdAt?.toISOString()??new Date().toISOString()})) as Vehicle;
}
async function activeFilter(filter:Record<string,unknown>={}){
  await connectMongoose();
  const vendors=await VendorProfileModel.distinct("_id",{status:"APPROVED"});
  // Both moderation status and current seller approval must permit public display.
  return {$and:[filter,{status:"ACTIVE",vendorId:{$in:vendors}}]};
}
export async function listActiveVehicles(filter:Record<string,unknown>={},limit=100){
  const rows=await VehicleModel.find(await activeFilter(filter)).sort({isFeatured:-1,createdAt:-1}).limit(limit).lean();
  return rows.map(row=>serialize(row as unknown as Row));
}
export async function listRecommendationVehicles(){
  const projection="vendorId title slug description make model year price mileage transmission fuelType bodyType numberOfSeats location origin images features condition fuelEconomyRating reliabilityRating maintenanceCostRating comfortRating performanceRating practicalityRating inspectionStatus status isFeatured createdAt seedTag";
  const rows=await VehicleModel.find(await activeFilter()).select(projection).slice("images",1).sort({createdAt:-1,_id:1}).lean();
  return rows.map(row=>serialize(row as unknown as Row));
}
export async function findActiveVehicleBySlug(slug:string){
  const row=await VehicleModel.findOne(await activeFilter({slug})).lean();
  return row?serialize(row as unknown as Row):null;
}
export async function inventoryStats(){
  const filter=await activeFilter();
  const [count,makes]=await Promise.all([VehicleModel.countDocuments(filter),VehicleModel.distinct("make",filter)]);
  return {count,makes:(makes as string[]).sort()};
}
