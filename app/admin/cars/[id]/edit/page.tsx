import Link from "next/link";
import {notFound} from "next/navigation";
import {isValidObjectId} from "mongoose";
import {requireAdmin} from "@/lib/auth";
import {connectMongoose} from "@/lib/db";
import {VehicleModel} from "@/models/Vehicle";
import {listingStatusLabel} from "@/lib/listing-status";
import {ActionForm} from "@/components/forms/action-form";
import {SubmitButton} from "@/components/forms/submit-button";
import {AdminListingFields} from "@/components/cars/admin-listing-fields";
export default async function Page({params}:{params:Promise<{id:string}>}){await requireAdmin();const{id}=await params;if(!isValidObjectId(id))notFound();await connectMongoose();const car=await VehicleModel.findById(id).select("+vin").lean();if(!car)notFound();return <div><Link href={`/admin/cars/${id}`} className="text-sm underline">← Back to listing</Link><header className="mt-5"><p className="eyebrow">ADMINISTRATION</p><h1 className="mt-2 text-2xl font-bold">Edit car information</h1><p className="mt-2 text-[#68756f]">Update the information buyers see for this listing.</p><p className="mt-3 text-sm"><b>Current status:</b> {listingStatusLabel(car.status)}. Admin edits do not change the listing&apos;s moderation status.</p></header><ActionForm kind="adminEditListing" className="mt-6 grid gap-5" pendingLabel="Saving car information..."><input type="hidden" name="id" value={id}/><AdminListingFields values={car}/><div className="flex flex-wrap gap-3"><Link href={`/admin/cars/${id}`} className="btn btn-light">Cancel</Link><SubmitButton pendingLabel="Saving changes..." className="btn btn-dark">Save changes</SubmitButton></div></ActionForm></div>}
