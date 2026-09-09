import {requireAdmin} from "@/lib/auth";
import {connectMongoose} from "@/lib/db";
import {InquiryModel} from "@/models/Inquiry";
import {VehicleModel} from "@/models/Vehicle";

export const dynamic="force-dynamic";

export default async function Page(){
  await requireAdmin();
  await connectMongoose();
  const inquiries=await InquiryModel.find({}).sort({createdAt:-1}).lean();
  const vehicleIds=[...new Set(inquiries.map(inquiry=>inquiry.vehicleId))];
  const vehicles=await VehicleModel.find({_id:{$in:vehicleIds}}).select("title").lean();
  const titles=new Map(vehicles.map(vehicle=>[String(vehicle._id),vehicle.title]));
  return <div><div><h2 className="text-xl font-bold">Platform inquiries</h2><p className="mt-1 text-sm text-[#68756f]">{inquiries.length} buyer inquiries</p></div>
    <div className="mt-6 grid gap-3">{inquiries.map(inquiry=><article className="card p-5" key={String(inquiry._id)}><div className="flex flex-wrap items-center justify-between gap-3"><div><b>{titles.get(inquiry.vehicleId)||"Vehicle inquiry"}</b><p className="mt-1 text-xs text-[#68756f]">{inquiry.kind.replaceAll("_"," ")}</p></div><span className={`pill ${inquiry.status==="NEW"?"bg-amber-100 text-amber-800":"bg-[#edf2ee]"}`}>{inquiry.status}</span></div><p className="mt-4 text-sm leading-6 text-[#536159]">{inquiry.message}</p></article>)}</div>
  </div>
}
