import "server-only";
import {betterAuth} from "better-auth";
import {createEmailAuthOptions} from "./email/auth-options";
import {mongodbAdapter} from "better-auth/adapters/mongodb";
import {nextCookies} from "better-auth/next-js";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {authDatabase,connectMongoose,connectMongoClient} from "./db";
import {VendorProfileModel} from "@/models/VendorProfile";
import {postLoginDestination,safeNext} from "./safe-next";
import type {UserRole} from "@/types";
export const auth=betterAuth({
  database:mongodbAdapter(authDatabase),
  ...createEmailAuthOptions(),
  secret:process.env.BETTER_AUTH_SECRET,
  baseURL:process.env.BETTER_AUTH_URL||process.env.NEXT_PUBLIC_APP_URL,
  user:{additionalFields:{role:{type:"string",required:false,defaultValue:"BUYER",input:false}}},
  plugins:[nextCookies()],
});
type SessionUser=NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["user"]&{role:UserRole};
export async function getSessionUser(){
  const requestHeaders=await headers();
  await connectMongoClient();
  const session=await auth.api.getSession({headers:requestHeaders});
  return session?.user as SessionUser|undefined;
}
export async function getCurrentUser(){
  const user=await getSessionUser();
  return user?.emailVerified?user:undefined;
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
  if(!user.emailVerified)redirect("/verify-email?email="+encodeURIComponent(user.email));
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
