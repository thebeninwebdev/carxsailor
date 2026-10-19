import Link from "next/link";
import { ArrowUpRight, Car, CheckCircle2, Clock3, Filter } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { connectMongoose } from "@/lib/db";
import { listingStatusLabel } from "@/lib/listing-status";
import { money } from "@/lib/utils";
import { VehicleModel } from "@/models/Vehicle";
import { VendorProfileModel } from "@/models/VendorProfile";

const filters = [["", "All"], ["PENDING_REVIEW", "Pending review"], ["ACTIVE", "Active"], ["REJECTED", "Rejected"], ["SUSPENDED", "Suspended"], ["DRAFT", "Drafts"], ["SOLD", "Sold"], ["ARCHIVED", "Archived"]] as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  await connectMongoose();
  const requested = (await searchParams).status;
  const status = filters.some(([value]) => value === requested) ? requested : "";
  const [cars, pending, active, total] = await Promise.all([
    VehicleModel.find(status ? { status } : {}).sort({ createdAt: -1 }).select("title price status mileage transmission location images vendorId").lean(),
    VehicleModel.countDocuments({ status: "PENDING_REVIEW" }), VehicleModel.countDocuments({ status: "ACTIVE" }), VehicleModel.countDocuments(),
  ]);
  const vendors = await VendorProfileModel.find({ _id: { $in: [...new Set(cars.map((car) => String(car.vendorId)))] } }).select("displayName").lean();
  const vendorNames = new Map(vendors.map((vendor) => [String(vendor._id), vendor.displayName]));
  return <div className="admin-overview">
    <section className="admin-intro"><div><p className="eyebrow">MARKETPLACE MODERATION</p><h2>Vehicle listings</h2><p>Review submissions, keep inventory accurate, and manage listing status.</p></div><div><Car /><span><b>{total.toLocaleString()} total cars</b><small>{pending} require review</small></span></div></section>
    <section className="admin-metrics"><article className="admin-metric green"><span><Car size={22} /></span><div><small>All listings</small><b>{total.toLocaleString()}</b><p>Marketplace inventory</p></div></article><article className="admin-metric amber"><span><Clock3 size={22} /></span><div><small>Pending review</small><b>{pending.toLocaleString()}</b><p>Awaiting moderation</p></div></article><article className="admin-metric blue"><span><CheckCircle2 size={22} /></span><div><small>Active listings</small><b>{active.toLocaleString()}</b><p>Visible to buyers</p></div></article></section>
    <section className="admin-panel"><div className="admin-panel-title"><div><p className="eyebrow">LISTING QUEUE</p><h3>{status ? listingStatusLabel(status) : "All vehicle listings"}</h3></div><span className="text-sm text-[#68756f]">{cars.length} shown</span></div><nav aria-label="Listing status" className="my-5 flex gap-2 overflow-x-auto pb-1">{filters.map(([value, label]) => <Link key={value} href={value ? `/admin/cars?status=${value}` : "/admin/cars"} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-bold transition ${status === value ? "border-[#163f31] bg-[#163f31] text-[#d7f25c]" : "border-[#dce2dd] bg-white text-[#53635b] hover:border-[#9db6a7]"}`}>{label}</Link>)}</nav><div className="admin-table">{cars.map((car) => <Link href={`/admin/cars/${car._id}`} key={String(car._id)}><div className="admin-thumb">{car.images?.[0]?.url ? <img src={car.images[0].url} alt="" /> : <Car size={20} />}</div><div><b>{car.title}</b><small>{car.mileage.toLocaleString()} km · {car.transmission} · {car.location?.city || "Location unavailable"}</small></div><strong>{money(car.price)}</strong><span>{vendorNames.get(String(car.vendorId)) || "Seller"}</span><em className={car.status.toLowerCase()}>{listingStatusLabel(car.status)}</em><ArrowUpRight size={17} /></Link>)}</div>{!cars.length && <div className="grid justify-items-center gap-2 py-10 text-center text-[#68756f]"><Filter className="text-[#2f7056]" /><h3 className="m-0 text-base font-bold text-[#182820]">No listings in this view</h3><p className="m-0 text-sm">Choose another status filter or return to all listings.</p><Link className="btn btn-light mt-2" href="/admin/cars">View all listings</Link></div>}</section>
  </div>;
}
