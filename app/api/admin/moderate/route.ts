import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {connectMongoose} from "@/lib/db";
import {VendorProfileModel} from "@/models/VendorProfile";
import {VehicleModel} from "@/models/Vehicle";
import {AuditLogModel} from "@/models/AuditLog";

const schema=z.object({
  targetType:z.enum(["VENDOR","VEHICLE"]),
  targetId:z.string().regex(/^[a-f\d]{24}$/i),
  action:z.enum(["APPROVE_VENDOR","REJECT_VENDOR","SUSPEND_VENDOR","APPROVE_LISTING","REJECT_LISTING","SUSPEND_LISTING","FEATURE_LISTING","UNFEATURE_LISTING"]),
});

export async function POST(r:Request){
  const admin=await requireAdmin();
  const p=schema.safeParse(Object.fromEntries(await r.formData()));
  if(!p.success)return NextResponse.json({error:"Invalid moderation request"},{status:422});
  await connectMongoose();
  const{targetType,targetId,action}=p.data;
  if(targetType==="VENDOR"){
    if(!["APPROVE_VENDOR","REJECT_VENDOR","SUSPEND_VENDOR"].includes(action))return NextResponse.json({error:"Invalid vendor action"},{status:422});
    const vendor=await VendorProfileModel.findById(targetId).select("status").lean();
    if(!vendor)return NextResponse.json({error:"Vendor not found"},{status:404});
    if(vendor.status==="APPROVED"&&action!=="SUSPEND_VENDOR")return NextResponse.json({error:"Approved vendors can only be suspended"},{status:409});
    if(vendor.status!=="APPROVED"&&action==="SUSPEND_VENDOR")return NextResponse.json({error:"Only approved vendors can be suspended"},{status:409});
    const status=action==="APPROVE_VENDOR"?"APPROVED":action==="REJECT_VENDOR"?"REJECTED":"SUSPENDED";
    await VendorProfileModel.updateOne({_id:targetId},{$set:{status}});
  }else{
    if(!["APPROVE_LISTING","REJECT_LISTING","SUSPEND_LISTING","FEATURE_LISTING","UNFEATURE_LISTING"].includes(action))return NextResponse.json({error:"Invalid listing action"},{status:422});
    const update=action==="FEATURE_LISTING"?{isFeatured:true}:action==="UNFEATURE_LISTING"?{isFeatured:false}:{status:action==="APPROVE_LISTING"?"ACTIVE":action==="REJECT_LISTING"?"REJECTED":"SUSPENDED"};
    await VehicleModel.updateOne({_id:targetId},{$set:update});
  }
  await AuditLogModel.create({actorId:admin.id,action,targetType,targetId});
  return NextResponse.redirect(new URL(`/admin/${targetType==="VENDOR"?"vendors":"cars"}/${targetId}`,r.url),303);
}
