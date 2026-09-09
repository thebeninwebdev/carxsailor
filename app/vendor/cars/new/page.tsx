import {SubmitButton} from "@/components/forms/submit-button";
import {VehicleImageUpload} from "@/components/cars/vehicle-image-upload";
import {ListingFields} from "@/components/cars/listing-fields";
import {ActionForm} from "@/components/forms/action-form";
import {requireVendor} from "@/lib/auth";
export default async function Page(){await requireVendor();return <ActionForm kind="createListing" className="card grid gap-4 p-7" pendingLabel="Uploading images and submitting listing...">
  <div><h2 className="text-xl font-bold">Add a car for approval</h2><p className="mt-1 text-sm text-[#68756f]">Submit your car details and photos for admin review. Your listing will be visible to buyers only after approval.</p></div>
  <ListingFields/><VehicleImageUpload/><SubmitButton pendingLabel="Submitting..." className="btn btn-dark">Submit for admin review</SubmitButton>
</ActionForm>;}
