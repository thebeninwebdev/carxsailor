import "server-only";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {auth} from "@/auth";
import {connectMongoose} from "./db";
import {VendorProfileModel} from "@/models/VendorProfile";
import {postLoginDestination,safeNext} from "./safe-next";
import type {UserRole} from "@/types";
type SessionUser={id:string;email:string;name:string;emailVerified:boolean;role:UserRole};
export async function getSessionUser(){
  const session=await auth();
  if(!session?.user?.id||!session.user.email) return undefined;
  return {id:session.user.id,email:session.user.email,name:session.user.name||session.user.email,emailVerified:true,role:session.user.role||"BUYER"} satisfies SessionUser;
}
export async function getCurrentUser(){
  const user=await getSessionUser();
  return user;
}
export async function getPostLoginDestination(user:{id:string;role:string},callback?:unknown) {
  if(user.role==="ADMIN") return postLoginDestination(user.role,false,callback);
  await connectMongoose();
  const hasProfile=!!await VendorProfileModel.exists({userId:user.id});
  return postLoginDestination(user.role,hasProfile,callback);
}
export async function requireUser(next="/dashboard"){
  const user=await getSessionUser();
  if(!user){
    const path=(await headers()).get("x-carxsailor-path");
    const intended=path&&(path===next||path.startsWith(next+"/")||path.startsWith(next+"?"))?path:next;
    redirect("/login?next="+encodeURIComponent(safeNext(intended)));
  }
  return user;
}
export async function requireAdmin(){const user=await requireUser("/admin");if(user.role!=="ADMIN")redirect(await getPostLoginDestination(user));return user;}
export async function requireVendor(){
  const user=await requireUser("/vendor");
  if(user.role==="ADMIN")redirect("/admin");
  await connectMongoose();
  if(!await VendorProfileModel.exists({userId:user.id,status:"APPROVED"}))redirect("/become-a-vendor");
  return user;
}
