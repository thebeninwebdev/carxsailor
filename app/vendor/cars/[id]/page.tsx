import {VehicleGallery} from "@/components/cars/vehicle-gallery";
import type {Vehicle} from "@/types";
import {SubmitButton} from "@/components/forms/submit-button";
import {ActionForm} from "@/components/forms/action-form";
import Link from "next/link";
import {notFound} from "next/navigation";
import {isValidObjectId} from "mongoose";
import {requireVendor} from "@/lib/auth";
import {connectMongoose} from "@/lib/db";
import {VehicleModel} from "@/models/Vehicle";
import {VendorProfileModel} from "@/models/VendorProfile";
import {listingStatusLabel} from "@/lib/listing-status";
export default async function Page({params}:{params:Promise<{id:string}>}) {
 const user=await requireVendor(); const {id}=await params;
 if(!isValidObjectId(id)) notFound();
 await connectMongoose();
 const vendor=await VendorProfileModel.findOne({userId:user.id}).select("_id").lean();
 if(!vendor) notFound();
 const car=await VehicleModel.findOne({_id:id,vendorId:vendor._id}).select("title status images seedTag").lean();
 if(!car) notFound();
 const gallery:Pick<Vehicle,"title"|"images"|"isDemo">={title:car.title,images:JSON.parse(JSON.stringify(car.images??[])),isDemo:!!car.seedTag};
 return <div className="card p-8"><p className="eyebrow">Vehicle listing</p><h2 className="mt-2 text-2xl font-bold">{car.title}</h2><div className="mt-6"><VehicleGallery key={id} vehicle={gallery}/></div><div className="mt-5 rounded-xl bg-[#f1f5f2] p-5"><h3 className="font-bold">{listingStatusLabel(car.status)}</h3><p className="mt-2 text-sm text-[#68756f]">{car.status==="PENDING_REVIEW"?"Your car listing has been submitted for admin review. It will be visible to buyers once an admin approves it. No further action is needed now.":car.status==="DRAFT"?"This listing has not been sent to the admin yet. Submit it for review to request approval.":car.status==="ACTIVE"?"Your listing has been approved and is visible to buyers.":car.status==="REJECTED"?"The admin did not approve this listing. It is not visible to buyers.":"This listing is not currently available to buyers."}</p></div>{car.status==="DRAFT"&&<ActionForm kind="submitListing" className="mt-5" pendingLabel="Submitting listing..."><input type="hidden" name="id" value={id}/><SubmitButton pendingLabel="Submitting..." className="btn btn-dark">Submit for admin review</SubmitButton></ActionForm>}{["DRAFT","REJECTED","PENDING_REVIEW","ACTIVE","SUSPENDED"].includes(car.status)&&<Link href={"/vendor/cars/"+id+"/edit"} className="btn btn-dark mt-5">Edit listing</Link>}<Link href="/vendor/cars" className="btn btn-light mt-5">Back to listings</Link></div>;
}