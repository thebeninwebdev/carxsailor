import {SubmitButton} from "@/components/forms/submit-button";
import {ActionForm} from "@/components/forms/action-form";
import {isValidObjectId} from "mongoose";
import {requireAdmin} from "@/lib/auth";
import {notFound} from "next/navigation";
import {connectMongoose,connectMongoClient,authDatabase} from "@/lib/db";
import {ObjectId} from "mongodb";
import {VendorProfileModel} from "@/models/VendorProfile";

export const dynamic="force-dynamic";

export default async function Page({params}:{params:Promise<{id:string}>}){
  await requireAdmin();const{id}=await params;if(!isValidObjectId(id))notFound();
  await connectMongoose();
  const vendor=await VendorProfileModel.findById(id).select("userId displayName businessName status location description verification createdAt updatedAt +phoneNumber +nin +rejectionReason").lean();
  if(!vendor)notFound();
  await connectMongoClient();
  const userId=String(vendor.userId);
  const account=await authDatabase.collection<{_id:string|ObjectId;name?:string;email?:string;emailVerified?:boolean;role?:string;createdAt?:Date;updatedAt?:Date}>("user").findOne(
    {_id:{$in:ObjectId.isValid(userId)?[userId,new ObjectId(userId)]:[userId]}},
    {projection:{name:1,email:1,emailVerified:1,role:1,createdAt:1,updatedAt:1}}
  );
  const date=(value:Date|undefined)=>value?new Date(value).toLocaleString("en-NG",{timeZone:"Africa/Lagos"}):"Not available";
  const details=[
    ["Full name",account?.name], ["Email",account?.email],
    ["Email verified",account?account.emailVerified?"Yes":"No":"Account unavailable"],
    ["Account role",account?.role], ["User ID",userId],
    ["Business name / Display name",vendor.displayName],
    ...(vendor.businessName&&vendor.businessName!==vendor.displayName?[["Previous business name",vendor.businessName]]:[]),
    ["Phone number",vendor.phoneNumber], ["NIN",vendor.nin],
    ["State",vendor.location?.state], ["City",vendor.location?.city],
    ["Business description",vendor.description],
    ["Identity verified",vendor.verification?.identityVerified?"Yes":"No"],
    ["Business verified",vendor.verification?.businessVerified?"Yes":"No"],
    ["Account created",date(account?.createdAt)], ["Account updated",date(account?.updatedAt)],
    ["Application submitted",date(vendor.createdAt)], ["Application updated",date(vendor.updatedAt)],
    ["Rejection reason",vendor.rejectionReason],
  ];
  const approved=vendor.status==="APPROVED";
  return <div className="card p-8">
    <p className="eyebrow">{vendor.businessName||"Vendor account"}</p>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{vendor.displayName}</h2><span className={`pill ${approved?"bg-green-100 text-green-800":vendor.status==="REJECTED"?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{vendor.status}</span></div>
    <h3 className="mt-6 font-bold">Account and application details</h3>
    <dl className="mt-4 grid gap-4 sm:grid-cols-2">{details.map(([label,value])=><div key={label} className="min-w-0"><dt className="text-sm text-[#68756f]">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value||"Not provided"}</dd></div>)}</dl>
    <ActionForm kind="moderate" pendingLabel="Updating seller status..." className="mt-5 flex gap-2">
      <input type="hidden" name="targetType" value="VENDOR"/>
      <input type="hidden" name="targetId" value={id}/>
      {approved?<SubmitButton pendingLabel="Suspending..." name="action" value="SUSPEND_VENDOR" className="btn btn-light">Suspend</SubmitButton>:<><SubmitButton pendingLabel="Approving..." name="action" value="APPROVE_VENDOR" className="btn btn-dark">Approve</SubmitButton><SubmitButton pendingLabel="Rejecting..." name="action" value="REJECT_VENDOR" className="btn btn-light">Reject</SubmitButton></>}
    </ActionForm>
  </div>
}
