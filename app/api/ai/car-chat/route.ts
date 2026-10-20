import {NextResponse} from "next/server";
import {headers} from "next/headers";
import {connectMongoose} from "@/lib/db";
import {VehicleModel} from "@/models/Vehicle";
import {VendorProfileModel} from "@/models/VendorProfile";
import {askVehicleAssistant,buildVehicleAssistantContext,vehicleAssistantRequestSchema} from "@/lib/ai/vehicle-assistant";
import {allowVehicleAssistantRequest} from "@/lib/ai/rate-limit";

export async function POST(request:Request){try{const raw=await request.text();if(raw.length>18000)return NextResponse.json({error:"Request too large."},{status:413});let body:unknown;try{body=JSON.parse(raw)}catch{return NextResponse.json({error:"Invalid request."},{status:400})}const parsed=vehicleAssistantRequestSchema.safeParse(body);if(!parsed.success)return NextResponse.json({error:"Ask a vehicle question between 3 and 1000 characters."},{status:422});const requestHeaders=await headers(),ip=requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()||"anonymous";if(!allowVehicleAssistantRequest(ip))return NextResponse.json({error:"Please wait a moment before asking Gemini another question."},{status:429});await connectMongoose();const car=await VehicleModel.findOne({_id:parsed.data.vehicleId,status:"ACTIVE"}).lean();if(!car||!await VendorProfileModel.exists({_id:car.vendorId,status:"APPROVED"}))return NextResponse.json({error:"This car is no longer available for research."},{status:404});const context=buildVehicleAssistantContext(car);return NextResponse.json(await askVehicleAssistant(context,parsed.data.question,parsed.data.history.slice(-6)))}catch(error){console.error("[car-chat]",error instanceof Error?error.name:"Unknown error");return NextResponse.json({error:"Gemini couldn't answer that right now. Please try again."},{status:503})}}
