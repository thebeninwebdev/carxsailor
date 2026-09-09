import {SubmitButton} from "@/components/forms/submit-button";
import {requireVendor} from "@/lib/auth";
import {VendorProfileModel} from "@/models/VendorProfile";
import {ActionForm} from "@/components/forms/action-form";
export default async function Page(){
  const user=await requireVendor();
  const vendor=await VendorProfileModel.findOne({userId:user.id,status:"APPROVED"}).lean();
  return <ActionForm kind="updateProfile" className="card grid max-w-2xl gap-4 p-7" pendingLabel="Saving profile..."><h2 className="text-xl font-bold">Public vendor profile</h2>
    <label><span className="label">Display name</span><input className="input" name="displayName" required minLength={2} maxLength={100} defaultValue={vendor?.displayName}/></label>
    <label><span className="label">Public description</span><textarea className="input min-h-28" name="description" maxLength={1000} defaultValue={vendor?.description}/></label><SubmitButton pendingLabel="Saving..." className="btn btn-dark">Save profile</SubmitButton>
  </ActionForm>;
}
