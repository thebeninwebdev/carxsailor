import {BadgeCheck} from "lucide-react";
export function isVerifiedSeller(status:string|undefined){return status==="APPROVED"}
export function VerifiedSellerBadge({compact=false}:{compact?:boolean}){return <span className="inline-flex items-center gap-1 rounded-full bg-[#e1f1df] px-2 py-1 text-xs font-bold text-[#163f31]" aria-label="Verified Seller — seller profile reviewed and approved by CarXSailor" title="Seller profile reviewed and approved by CarXSailor."><BadgeCheck size={compact?14:16} aria-hidden/>{compact?"Verified":"Verified Seller"}</span>}
