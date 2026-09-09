import {pageMetadata} from "@/lib/seo";
import {notFound} from "next/navigation";
import {isValidObjectId} from "mongoose";
import {connectMongoose} from "@/lib/db";
import {VendorProfileModel} from "@/models/VendorProfile";
import {listActiveVehicles} from "@/lib/vehicles";
import {VehicleCard} from "@/components/cars/vehicle-card";
export async function generateMetadata({params}:{params:Promise<{vendorId:string}>}) {
  const {vendorId}=await params;
  if(!isValidObjectId(vendorId))notFound();
  await connectMongoose();
  const vendor=await VendorProfileModel.findOne({_id:vendorId,status:"APPROVED"}).select("displayName location userId").lean();
  if(!vendor)notFound();
  return pageMetadata(vendor.displayName + " - Cars for Sale", "Browse cars listed by " + vendor.displayName + (vendor.location?.city ? " in " + vendor.location.city : " in Nigeria") + ". View vehicle details, prices and condition information on CarXSailor.", "/vendors/" + vendorId, {noIndex: vendor.userId === "test-seller"});
}
export default async function Page({params}:{params:Promise<{vendorId:string}>}){
  const {vendorId}=await params;
  if(!isValidObjectId(vendorId))notFound();
  await connectMongoose();
  const vendor=await VendorProfileModel.findOne({_id:vendorId,status:"APPROVED"}).select("displayName businessName description location").lean();
  if(!vendor)notFound();
  const cars=await listActiveVehicles({vendorId});
  return <div className="container py-16"><div className="card p-8"><p className="eyebrow">Approved vendor</p><h1 className="display mt-3 text-4xl">{vendor.displayName}</h1><p className="mt-4 max-w-xl leading-7 text-[#68756f]">{vendor.description}</p><p className="mt-3">{vendor.location?.city}</p></div><div className="grid-cars mt-8">{cars.map(car=><VehicleCard key={car.id} vehicle={car}/>)}</div></div>;
}
