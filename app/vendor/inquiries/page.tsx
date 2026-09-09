import {requireVendor} from "@/lib/auth";
import {VendorProfileModel} from "@/models/VendorProfile";
import {InquiryModel} from "@/models/Inquiry";
import {VehicleModel} from "@/models/Vehicle";
export default async function Page(){
  const user=await requireVendor();
  const vendor=await VendorProfileModel.findOne({userId:user.id,status:"APPROVED"}).lean();
  const inquiries=vendor?await InquiryModel.find({vendorId:String(vendor._id)}).sort({createdAt:-1}).lean():[];
  const ids=inquiries.map(row=>row.vehicleId).filter(id=>/^[a-f\d]{24}$/i.test(id));
  const cars=await VehicleModel.find({_id:{$in:ids}}).select("title").lean();
  const titles=new Map(cars.map(car=>[String(car._id),car.title]));
  return <div><h2 className="text-xl font-bold">Buyer inquiries</h2>{inquiries.length?<div className="mt-6 grid gap-3">{inquiries.map(row=><article key={String(row._id)} className="card p-6"><h3 className="font-bold">{titles.get(row.vehicleId)||"Vehicle inquiry"}</h3><p className="mt-2 text-sm">{row.kind.replaceAll("_"," ")} ? {row.status}</p><p className="mt-4">{row.message}</p></article>)}</div>:<p className="card mt-6 p-8">No buyer inquiries yet.</p>}</div>;
}
