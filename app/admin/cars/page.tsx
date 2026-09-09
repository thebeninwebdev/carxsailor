import Link from "next/link";
import {requireAdmin} from "@/lib/auth";
import {connectMongoose} from "@/lib/db";
import {money} from "@/lib/utils";
import {VehicleModel} from "@/models/Vehicle";
import {listingStatusLabel} from "@/lib/listing-status";
const filters=[["","All"],["PENDING_REVIEW","Pending"],["ACTIVE","Approved"],["REJECTED","Rejected"],["SUSPENDED","Suspended"],["DRAFT","Drafts"],["SOLD","Sold"],["ARCHIVED","Archived"]];
export default async function Page({searchParams}:{searchParams:Promise<{status?:string}>}){
  await requireAdmin();
  await connectMongoose();
  const requested=(await searchParams).status;
  const status=filters.some(([value])=>value===requested)?requested:"";
  const cars=await VehicleModel.find(status?{status}:{}).sort({createdAt:-1}).select("title make model year price status location").lean();
  return <div><h2 className="text-xl font-bold">Listing moderation</h2><p className="mt-1 text-sm text-[#68756f]">{cars.length} vehicle listings</p>
    <nav aria-label="Listing status" className="mt-5 flex flex-wrap gap-2">{filters.map(([value,label])=><Link key={value} href={value?"/admin/cars?status="+value:"/admin/cars"} className={"btn "+(status===value?"btn-dark":"btn-light")}>{label}</Link>)}</nav>
    <div className="mt-6 grid gap-3">{cars.map(car=><Link href={"/admin/cars/"+car._id} className="card flex flex-wrap items-center justify-between gap-4 p-5 hover:border-[#79a28f]" key={String(car._id)}><div><b>{car.title}</b><p className="mt-1 text-sm text-[#68756f]">{money(car.price)} ? {car.location?.city||"Location unavailable"}</p></div><span className="pill">{listingStatusLabel(car.status)}</span></Link>)}</div>
    {!cars.length&&<p className="card mt-6 p-6">No listings in this view.</p>}
  </div>;
}
