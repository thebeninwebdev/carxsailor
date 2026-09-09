import "server-only";
import {NextResponse} from "next/server";
import {MutationError} from "./mutation-result";
export async function jsonMutation(request:Request,operation:(input:unknown)=>Promise<unknown>){
  if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
  try{
    const body=await request.text();
    if(body.length>10000)throw new MutationError("Request too large.",413);
    let input:unknown;try{input=JSON.parse(body);}catch{throw new MutationError("Invalid JSON.",400);}
    return NextResponse.json(await operation(input));
  }catch(error){
    if(error instanceof MutationError)return NextResponse.json({error:error.message},{status:error.status});
    console.error("[JSON mutation]",error instanceof Error?error.name:"Unknown error");
    return NextResponse.json({error:"The operation could not be completed. Please try again."},{status:500});
  }
}
