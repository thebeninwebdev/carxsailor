import {NextResponse} from "next/server";
import {z} from "zod";
import {interpretCarRequest} from "@/lib/ai/parse-car-request";
import {preferenceSchema} from "@/lib/dss/preferences";
import {recommend} from "@/lib/dss/recommend";
const schema=z.union([z.object({message:z.string().trim().min(3).max(3000)}),z.object({preference:preferenceSchema})]);
export async function POST(request:Request){try{const body=await request.text();if(body.length>10000)return NextResponse.json({error:"Request too large"},{status:413});const parsed=schema.safeParse(JSON.parse(body));if(!parsed.success)return NextResponse.json({error:"Check your budget and preferences, then try again."},{status:422});const preference="message" in parsed.data?await interpretCarRequest(parsed.data.message):{...parsed.data.preference,hardConstraints:[],missingInformation:[],clarificationRequired:false};if(preference.clarificationRequired)return NextResponse.json({preference,clarification:preference.clarificationQuestion});return NextResponse.json(await recommend(preference))}catch{return NextResponse.json({error:"Could not load recommendations. Please try again."},{status:500})}}
