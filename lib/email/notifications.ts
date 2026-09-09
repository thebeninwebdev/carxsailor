import "server-only";
import {ObjectId} from "mongodb";
import {connectMongoose,connectMongoClient,authDatabase} from "@/lib/db";
import {VehicleModel} from "@/models/Vehicle";
import {VendorProfileModel} from "@/models/VendorProfile";
import {InquiryModel} from "@/models/Inquiry";
import {money} from "@/lib/utils";
import {adminNotificationEmail,appUrl} from "./config";
import {renderEmail,type ListingEmailKind} from "./templates";
import {sendTransactionalEmail} from "./send-email";
import {scheduleNotification} from "./schedule";

type Account={_id:ObjectId|string;email:string;name?:string};
function accountQuery(id:string){return {_id:{$in:ObjectId.isValid(id)?[id,new ObjectId(id)]:[id]}};}

export function notifyListingOwner(kind:ListingEmailKind|"inquiry",listingId:string){
  scheduleNotification(kind,async()=>{
    await Promise.all([connectMongoose(),connectMongoClient()]);
    const car=await VehicleModel.findById(listingId).lean();
    if(!car)throw new Error("Listing no longer exists.");
    const vendor=await VendorProfileModel.findById(car.vendorId).lean();
    if(!vendor)throw new Error("Seller no longer exists.");
    const owner=await authDatabase.collection<Account>("user").findOne(accountQuery(String(vendor.userId)));
    if(!owner)throw new Error("Account no longer exists.");
    const url=kind==="inquiry"?appUrl("/vendor/inquiries"):kind==="car-approved"?appUrl("/cars/"+encodeURIComponent(car.slug)):appUrl("/vendor/cars/"+encodeURIComponent(listingId));
    return sendTransactionalEmail({to:owner.email,template:kind,...renderEmail({kind,name:owner.name,title:car.title,reference:listingId,url})});
  });
}

export function notifyInquiryAdmin(inquiryId:string){
  scheduleNotification("admin-inquiry",async()=>{
    await Promise.all([connectMongoose(),connectMongoClient()]);
    const inquiry=await InquiryModel.findById(inquiryId).lean();
    if(!inquiry)throw new Error("Inquiry no longer exists.");
    const car=await VehicleModel.findById(inquiry.vehicleId).select("title slug price").lean();
    if(!car)throw new Error("Inquiry listing no longer exists.");
    const customer=await authDatabase.collection<Account>("user").findOne(accountQuery(String(inquiry.buyerId)));
    if(!customer)throw new Error("Inquiry customer no longer exists.");
    const reference=String(inquiry.reference||inquiry._id);
    const rendered=renderEmail({kind:"admin-inquiry",customerName:customer.name,customerEmail:customer.email,title:String(car.title),price:money(Number(car.price)),message:String(inquiry.message),reference,listingReference:String(car._id),submittedAt:new Date(inquiry.createdAt).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Lagos"}),adminUrl:appUrl("/admin/inquiries#inquiry-"+encodeURIComponent(reference)),listingUrl:appUrl("/cars/"+encodeURIComponent(String(car.slug)))});
    return sendTransactionalEmail({to:adminNotificationEmail(),replyTo:customer.email,template:"admin-inquiry",idempotencyKey:"admin-inquiry-"+inquiryId,...rendered});
  });
}