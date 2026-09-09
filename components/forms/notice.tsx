"use client";
import {useSearchParams} from "next/navigation";
const messages=new Set(["Car approved successfully.","Car rejected successfully.","Car suspended successfully.","Featured status updated.","Seller status updated successfully.","Listing submitted for admin review.","Listing updated and submitted for review.","Seller application received.","Seller profile updated."]);
export function MutationNotice(){
  const notice=useSearchParams().get("notice");
  return notice&&messages.has(notice)?<p role="status" className="container my-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">{notice}</p>:null;
}
