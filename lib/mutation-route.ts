import "server-only";
import {NextResponse} from "next/server";
import {mutations} from "./mutations";
import {MutationError, type MutationKind} from "./mutation-result";
export async function mutationRoute(request:Request, kind:MutationKind, id?:string) {
  const origin=request.headers.get("origin");
  if(!origin || origin!==new URL(request.url).origin) return NextResponse.json({error:"Invalid request origin."},{status:403});
  try {
    const form=await request.formData();
    if(id) form.set("id",id);
    const result=await mutations[kind](form);
    if(request.headers.get("accept")?.includes("application/json")) return NextResponse.json({success:true,...result});
    return NextResponse.redirect(new URL(result.destination+(result.destination.includes("?")?"&":"?")+"notice="+encodeURIComponent(result.message),request.url),303);
  } catch(error) {
    if(error instanceof MutationError) return NextResponse.json({error:error.message},{status:error.status});
    console.error("[mutation route]",kind,error instanceof Error?error.name:"Unknown error");
    return NextResponse.json({error:"The operation could not be completed. Please try again."},{status:500});
  }
}
