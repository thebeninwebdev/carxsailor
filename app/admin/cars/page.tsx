import Link from "next/link";
import {connectMongoose} from "@/lib/db";
import {money} from "@/lib/utils";
import {VehicleModel} from "@/models/Vehicle";

export const dynamic="force-dynamic";

export default async function Page(){
  await connectMongoose();
  const cars=await VehicleModel.find({}).sort({createdAt:-1}).select("title make model year price status location").lean();
  return <div><div><h2 className="text-xl font-bold">Listing moderation</h2><p className="mt-1 text-sm text-[#68756f]">{cars.length} vehicle listings</p></div>
    <div className="mt-6 grid gap-3">{cars.map(car=><Link href={`/admin/cars/${car._id}`} className="card flex flex-wrap items-center justify-between gap-4 p-5 hover:border-[#79a28f]" key={String(car._id)}><div><b>{car.title||`${car.year} ${car.make} ${car.model}`}</b><p className="mt-1 text-sm text-[#68756f]">{money(car.price)} · {car.location?.city||"Location unavailable"}</p></div><span className={`pill ${car.status==="ACTIVE"?"bg-green-100 text-green-800":car.status==="REJECTED"?"bg-red-100 text-red-800":"bg-amber-100 text-amber-800"}`}>{car.status.replaceAll("_"," ")}</span></Link>)}</div>
  </div>
}
