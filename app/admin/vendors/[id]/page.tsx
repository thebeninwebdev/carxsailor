import {SubmitButton} from "@/components/forms/submit-button";
import {ActionForm} from "@/components/forms/action-form";
import {isValidObjectId} from "mongoose";
import {requireAdmin} from "@/lib/auth";
import {notFound} from "next/navigation";
import {connectMongoose} from "@/lib/db";
import {VendorProfileModel} from "@/models/VendorProfile";

export const dynamic="force-dynamic";

export default async function Page({params}:{params:Promise<{id:string}>}){
  await requireAdmin();const{id}=await params;if(!isValidObjectId(id))notFound();
  await connectMongoose();
  const vendor=await VendorProfileModel.findById(id).select("displayName businessName status location description").lean();
  if(!vendor)notFound();
  const approved=vendor.status==="APPROVED";
  return <div className="card p-8">
    <p className="eyebrow">{vendor.businessName||"Vendor account"}</p>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{vendor.displayName}</h2><span className={`pill ${approved?"bg-green-100 text-green-800":vendor.status==="REJECTED"?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{vendor.status}</span></div>
    <p className="mt-3 text-sm text-[#68756f]">{vendor.location?.city||"Location unavailable"}{vendor.description?` · ${vendor.description}`:""}</p>
    <ActionForm kind="moderate" pendingLabel="Updating seller status..." className="mt-5 flex gap-2">
      <input type="hidden" name="targetType" value="VENDOR"/>
      <input type="hidden" name="targetId" value={id}/>
      {approved?<SubmitButton pendingLabel="Suspending..." name="action" value="SUSPEND_VENDOR" className="btn btn-light">Suspend</SubmitButton>:<><SubmitButton pendingLabel="Approving..." name="action" value="APPROVE_VENDOR" className="btn btn-dark">Approve</SubmitButton><SubmitButton pendingLabel="Rejecting..." name="action" value="REJECT_VENDOR" className="btn btn-light">Reject</SubmitButton></>}
    </ActionForm>
  </div>
}
