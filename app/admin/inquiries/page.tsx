import {ObjectId} from "mongodb";
import Link from "next/link";
import {requireAdmin} from "@/lib/auth";
import {authDatabase,connectMongoose,connectMongoClient} from "@/lib/db";
import {InquiryModel} from "@/models/Inquiry";
import {VehicleModel} from "@/models/Vehicle";

export const dynamic="force-dynamic";
type Account={_id:ObjectId|string;name?:string;email:string};

export default async function Page(){
  await requireAdmin();
  await Promise.all([connectMongoose(),connectMongoClient()]);
  const inquiries=await InquiryModel.find({}).sort({createdAt:-1}).lean();
  const vehicleIds=[...new Set(inquiries.map(inquiry=>inquiry.vehicleId))];
  const buyerIds=[...new Set(inquiries.map(inquiry=>String(inquiry.buyerId)))];
  const accountIds=buyerIds.flatMap(id=>ObjectId.isValid(id)?[id,new ObjectId(id)]:[id]);
  const [vehicles,accounts]=await Promise.all([
    VehicleModel.find({_id:{$in:vehicleIds}}).select("title slug").lean(),
    authDatabase.collection<Account>("user").find({_id:{$in:accountIds}}).project({name:1,email:1}).toArray(),
  ]);
  const cars=new Map(vehicles.map(vehicle=>[String(vehicle._id),{title:String(vehicle.title),slug:String(vehicle.slug)}]));
  const customers=new Map(accounts.map(account=>[String(account._id),account]));
  return <div><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Platform inquiries</h2><p className="mt-1 text-sm text-[#68756f]">{inquiries.length} buyer inquiries</p></div><span className="pill bg-amber-100 text-amber-800">{inquiries.filter(inquiry=>inquiry.status==="NEW").length} new</span></div>
    <div className="mt-6 grid gap-3">{inquiries.map(inquiry=>{const car=cars.get(inquiry.vehicleId),customer=customers.get(String(inquiry.buyerId)),reference=String(inquiry.reference||inquiry._id);return <article id={"inquiry-"+reference} className="card scroll-mt-24 p-5" key={String(inquiry._id)}><div className="flex flex-wrap items-start justify-between gap-3"><div><b>{car?.title||"Vehicle inquiry"}</b><p className="mt-1 text-xs text-[#68756f]">{reference} · {inquiry.kind.replaceAll("_"," ")} · {new Date(inquiry.createdAt).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"})}</p></div><span className={`pill ${inquiry.status==="NEW"?"bg-amber-100 text-amber-800":"bg-[#edf2ee]"}`}>{inquiry.status}</span></div><dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-[#68756f]">Customer</dt><dd className="font-bold">{customer?.name||"Name not provided"}</dd></div><div><dt className="text-[#68756f]">Email</dt><dd><a className="underline" href={customer?.email?"mailto:"+customer.email:undefined}>{customer?.email||"Unavailable"}</a></dd></div></dl><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#536159]">{inquiry.message}</p>{car&&<Link className="btn btn-light mt-4" href={"/cars/"+car.slug}>View car listing</Link>}</article>})}</div>
  </div>;
}