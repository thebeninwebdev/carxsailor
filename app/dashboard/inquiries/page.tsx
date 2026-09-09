import {Car,Heart,History,MessageSquare} from "lucide-react";
import {DashboardShell} from "@/components/dashboard/shell";
import {requireUser} from "@/lib/auth";
import {connectMongoose} from "@/lib/db";
import {InquiryModel} from "@/models/Inquiry";
import {VehicleModel} from "@/models/Vehicle";
const links=[{href:"/dashboard",label:"My Garage",icon:Car},{href:"/dashboard/favorites",label:"Saved cars",icon:Heart},{href:"/dashboard/inquiries",label:"Inquiries",icon:MessageSquare},{href:"/dashboard/recommendations",label:"My decisions",icon:History}];
export default async function Page(){
  const user=await requireUser("/dashboard/inquiries");await connectMongoose();
  const inquiries=await InquiryModel.find({buyerId:user.id}).sort({createdAt:-1}).lean();
  const ids=inquiries.map(row=>row.vehicleId).filter(id=>/^[a-f\d]{24}$/i.test(id));
  const cars=await VehicleModel.find({_id:{$in:ids}}).select("title").lean();
  const titles=new Map(cars.map(car=>[String(car._id),car.title]));
  return <DashboardShell title="Your inquiries" subtitle="My Garage" links={links}>
    {inquiries.length?<div className="grid gap-3">{inquiries.map(row=><article className="card p-6" key={String(row._id)}><h2 className="font-bold">{titles.get(row.vehicleId)||"Vehicle inquiry"}</h2><p className="mt-2 text-sm">{String(row.reference||row._id)} · {row.kind.replaceAll("_"," ")} · {row.status}</p><p className="mt-4">{row.message}</p></article>)}</div>:<div className="card p-10"><h2 className="font-bold">No conversations yet</h2><p className="mt-2 text-sm text-[#68756f]">Contact a vendor from a vehicle page to start one.</p></div>}
  </DashboardShell>;
}
