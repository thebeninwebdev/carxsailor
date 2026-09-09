import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/auth";
import {connectMongoose} from "@/lib/db";
import {FavoriteModel} from "@/models/Favorite";
import {setFavorite} from "@/lib/buyer-mutations";
import {jsonMutation} from "@/lib/json-mutation";
function payload(input:unknown,saved:boolean){return {...(input&&typeof input==="object"?input:{}),saved};}
export async function POST(request:Request){return jsonMutation(request,input=>setFavorite(payload(input,true)));}
export async function DELETE(request:Request){return jsonMutation(request,input=>setFavorite(payload(input,false)));}
export async function GET(request:Request){
  try{
    const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Sign in to continue."},{status:401});
    const vehicleId=new URL(request.url).searchParams.get("vehicleId");
    if(!vehicleId||!/^[a-f\d]{24}$/i.test(vehicleId))return NextResponse.json({error:"Invalid vehicle."},{status:422});
    await connectMongoose();
    return NextResponse.json({saved:!!await FavoriteModel.exists({userId:user.id,vehicleId})},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    console.error("[favorite status]",error instanceof Error?error.name:"Unknown error");
    return NextResponse.json({error:"Could not check saved status."},{status:500});
  }
}
