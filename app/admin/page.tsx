import {Metric} from "@/components/dashboard/shell";
import {authDatabase,connectMongoose} from "@/lib/db";
import {VehicleModel} from "@/models/Vehicle";
import {VendorProfileModel} from "@/models/VendorProfile";

export const dynamic="force-dynamic";

export default async function Page(){
  await connectMongoose();
  const[users,pendingVendors,activeCars,pendingListings]=await Promise.all([
    authDatabase.collection("user").countDocuments(),
    VendorProfileModel.countDocuments({status:"PENDING"}),
    VehicleModel.countDocuments({status:"ACTIVE"}),
    VehicleModel.countDocuments({status:"PENDING_REVIEW"}),
  ]);
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <Metric label="Total users" value={users} detail="Better Auth users"/>
    <Metric label="Pending vendors" value={pendingVendors} detail="Needs review"/>
    <Metric label="Active cars" value={activeCars} detail="Public inventory"/>
    <Metric label="Pending listings" value={pendingListings} detail="Needs moderation"/>
  </div>
}
