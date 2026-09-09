"use server";
import {setFavorite,sendInquiry,saveDecision} from "./buyer-mutations";
import {MutationError} from "./mutation-result";
type Result<T>={success:true;data:T}|{success:false;error:string;status:number};
async function run<T>(name:string,operation:()=>Promise<T>):Promise<Result<T>>{
  try{return {success:true,data:await operation()};}
  catch(error){
    if(error instanceof MutationError)return {success:false,error:error.message,status:error.status};
    console.error("[buyer mutation]",name,error instanceof Error?error.name:"Unknown error");
    return {success:false,error:"The operation could not be completed. Please try again.",status:500};
  }
}
export async function favoriteAction(vehicleId:string,saved:boolean){return run("favorite",()=>setFavorite({vehicleId,saved}));}
export async function inquiryAction(input:unknown){return run("inquiry",()=>sendInquiry(input));}
export async function decisionAction(preference:unknown){return run("decision",()=>saveDecision(preference));}
