import Link from "next/link";
import {MapPin} from "lucide-react";
import {VendorProfileModel} from "@/models/VendorProfile";
import {VerifiedSellerBadge} from "./verified-seller-badge";
export async function PublicSellerSummary({vendorId}:{vendorId:string}){const seller=await VendorProfileModel.findOne({_id:vendorId,status:"APPROVED"}).select("displayName businessName location status").lean();if(!seller)return null;return <section className="mt-5 border-t border-[#e4e9e5] pt-4"><p className="eyebrow">Seller</p><div className="mt-2 flex flex-wrap items-center gap-2"><Link href={`/vendors/${seller._id}`} className="font-bold">{seller.businessName||seller.displayName}</Link><VerifiedSellerBadge compact/></div><p className="mt-1 flex items-center gap-1 text-sm text-[#68756f]"><MapPin size={14}/>{[seller.location?.city,seller.location?.state].filter(Boolean).join(", ")||"Nigeria"}</p></section>}
