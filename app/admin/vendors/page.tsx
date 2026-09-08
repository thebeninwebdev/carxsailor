import Link from "next/link";
import {connectMongoose} from "@/lib/db";
import {VendorProfileModel} from "@/models/VendorProfile";

export const dynamic="force-dynamic";

export default async function Page(){
  await connectMongoose();
  const vendors=await VendorProfileModel.find({}).sort({createdAt:-1}).select("displayName businessName status location createdAt").lean();
  return <div><div><h2 className="text-xl font-bold">Vendor moderation</h2><p className="mt-1 text-sm text-[#68756f]">{vendors.length} seller profiles</p></div>
    <div className="mt-6 grid gap-3">{vendors.map(vendor=><Link href={`/admin/vendors/${vendor._id}`} className="card flex flex-wrap items-center justify-between gap-4 p-5 hover:border-[#79a28f]" key={String(vendor._id)}><div><b>{vendor.displayName}</b><p className="mt-1 text-sm text-[#68756f]">{vendor.businessName||"Individual seller"} · {vendor.location?.city||"Location unavailable"}</p></div><span className={`pill ${vendor.status==="APPROVED"?"bg-green-100 text-green-800":vendor.status==="REJECTED"||vendor.status==="SUSPENDED"?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{vendor.status}</span></Link>)}</div>
  </div>
}
