import {SubmitButton} from "@/components/forms/submit-button";
import Link from "next/link";
import {notFound} from "next/navigation";
import {isValidObjectId} from "mongoose";
import {requireAdmin} from "@/lib/auth";
import {connectMongoose} from "@/lib/db";
import {VehicleModel} from "@/models/Vehicle";
import {ActionForm} from "@/components/forms/action-form";
import {listingStatusLabel} from "@/lib/listing-status";
import {money} from "@/lib/utils";
export default async function Page({params}:{params:Promise<{id:string}>}){
  await requireAdmin();
  const {id}=await params;
  if(!isValidObjectId(id))notFound();
  await connectMongoose();
  const car=await VehicleModel.findById(id).lean();
  if(!car)notFound();
  return <div><div className="card p-8"><p className="eyebrow">Listing review</p><h2 className="mt-2 text-2xl font-bold">{car.title}</h2>
    <p className="mt-3">{listingStatusLabel(car.status)} · {money(car.price)}</p><div className="mt-5 grid gap-3 rounded-xl bg-[#f4f6f1] p-4 text-sm sm:grid-cols-2"><p><b>Vehicle:</b> {car.year} {car.make} {car.model}</p><p><b>Mileage:</b> {car.mileage.toLocaleString()} km</p><p><b>Transmission:</b> {car.transmission}</p><p><b>Fuel type:</b> {car.fuelType}</p><p><b>Body type:</b> {car.bodyType}</p><p><b>Origin:</b> {car.origin?.replaceAll("_"," ")||"Not specified"}</p><p><b>Location:</b> {car.location?.city||"Not specified"}, {car.location?.state||""}</p><p><b>Inspection:</b> {car.inspectionStatus?.replaceAll("_"," ")}</p></div><p className="mt-4">{car.description}</p>
    <Link className="btn btn-dark mt-5" href={`/admin/cars/${id}/edit`}>Edit car information</Link></div><section className="card mt-5 p-6"><p className="eyebrow">Moderation</p>
    <ActionForm kind="moderate" className="mt-4 flex flex-wrap gap-2" pendingLabel="Applying moderation decision...">
      <input type="hidden" name="targetType" value="VEHICLE"/><input type="hidden" name="targetId" value={id}/>
      {car.status==="PENDING_REVIEW"&&<><SubmitButton pendingLabel="Approving..." name="action" value="APPROVE_LISTING" className="btn btn-dark">Approve</SubmitButton><SubmitButton pendingLabel="Rejecting..." name="action" value="REJECT_LISTING" className="btn btn-light">Reject</SubmitButton></>}
      {car.status==="ACTIVE"&&<><SubmitButton pendingLabel="Suspending..." name="action" value="SUSPEND_LISTING" className="btn btn-light">Suspend</SubmitButton><SubmitButton pendingLabel="Submitting..." name="action" value={car.isFeatured?"UNFEATURE_LISTING":"FEATURE_LISTING"} className="btn btn-light">{car.isFeatured?"Unfeature":"Feature"}</SubmitButton></>}
    </ActionForm></section><Link className="btn btn-light mt-5" href="/admin/cars">Back to listings</Link>
  </div>;
}
