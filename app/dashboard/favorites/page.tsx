import Link from "next/link";
import {requireUser} from "@/lib/auth";
import {connectMongoose} from "@/lib/db";
import {FavoriteModel} from "@/models/Favorite";
import {listActiveVehicles} from "@/lib/vehicles";
import {VehicleCard} from "@/components/cars/vehicle-card";
export default async function Page(){const user=await requireUser("/dashboard/favorites");await connectMongoose();const saved=await FavoriteModel.find({userId:user.id}).distinct("vehicleId");const vehicles=await listActiveVehicles({_id:{$in:saved}},1000);return <div className="container py-14"><Link className="text-link" href="/dashboard">Back to My Garage</Link><h1 className="display mt-6 text-5xl">Saved cars</h1><p className="mt-4 text-[#69756f]">Your shortlist, ready for another look. Sold or inactive listings are no longer shown.</p>{vehicles.length?<div className="grid-cars mt-8">{vehicles.map(v=><VehicleCard key={v.id} vehicle={v}/>)}</div>:<div className="card mt-8 p-10"><h2 className="text-xl font-bold">Your shortlist starts with a car.</h2><p className="mt-3">Use Save car on a listing to keep it here.</p><Link className="btn btn-dark mt-6" href="/cars">Discover cars</Link></div>}</div>}
