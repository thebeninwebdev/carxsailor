import {SubmitButton} from "@/components/forms/submit-button";
import {notFound} from "next/navigation";
import {isValidObjectId} from "mongoose";
import {requireVendor} from "@/lib/auth";
import {VehicleModel} from "@/models/Vehicle";
import {VendorProfileModel} from "@/models/VendorProfile";
import {ActionForm} from "@/components/forms/action-form";
import {ListingFields} from "@/components/cars/listing-fields";
export default async function Page({params}:{params:Promise<{id:string}>}){
  const user=await requireVendor();
  const {id}=await params;
  if(!isValidObjectId(id))notFound();
  const vendor=await VendorProfileModel.findOne({userId:user.id,status:"APPROVED"}).lean();
  const car=vendor?await VehicleModel.findOne({_id:id,vendorId:vendor._id}).lean():null;
  if(!car)notFound();
  if(!["DRAFT","REJECTED","PENDING_REVIEW","ACTIVE","SUSPENDED"].includes(car.status))return <p>This listing cannot be edited in its current status.</p>;
  return <ActionForm kind="editListing" className="card grid gap-4 p-7" pendingLabel="Saving listing..."><h2 className="text-xl font-bold">Edit {car.title}</h2>
    <p className="text-sm text-[#68756f]">Changes are submitted for admin review before the listing goes live.</p>
    <input type="hidden" name="id" value={id}/>
    <ListingFields values={{make:car.make,model:car.model,year:car.year,price:car.price,mileage:car.mileage,city:car.location?.city??"",transmission:car.transmission,description:car.description}}/>
    <SubmitButton pendingLabel="Saving..." className="btn btn-dark">Save changes</SubmitButton>
  </ActionForm>;
}
