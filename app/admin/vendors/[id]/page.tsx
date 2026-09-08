import {notFound} from "next/navigation";
import {connectMongoose} from "@/lib/db";
import {VendorProfileModel} from "@/models/VendorProfile";

export const dynamic="force-dynamic";

export default async function Page({params}:{params:Promise<{id:string}>}){
  const{id}=await params;
  await connectMongoose();
  const vendor=await VendorProfileModel.findById(id).select("displayName businessName status location description").lean();
  if(!vendor)notFound();
  const approved=vendor.status==="APPROVED";
  return <div className="card p-8">
    <p className="eyebrow">{vendor.businessName||"Vendor account"}</p>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{vendor.displayName}</h2><span className={`pill ${approved?"bg-green-100 text-green-800":vendor.status==="REJECTED"?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{vendor.status}</span></div>
    <p className="mt-3 text-sm text-[#68756f]">{vendor.location?.city||"Location unavailable"}{vendor.description?` · ${vendor.description}`:""}</p>
    <form action="/api/admin/moderate" method="post" className="mt-5 flex gap-2">
      <input type="hidden" name="targetType" value="VENDOR"/>
      <input type="hidden" name="targetId" value={id}/>
      {approved?<button name="action" value="SUSPEND_VENDOR" className="btn btn-light">Suspend</button>:<><button name="action" value="APPROVE_VENDOR" className="btn btn-dark">Approve</button><button name="action" value="REJECT_VENDOR" className="btn btn-light">Reject</button></>}
    </form>
  </div>
}
