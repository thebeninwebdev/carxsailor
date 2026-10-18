import "server-only";
import {betterAuth} from "better-auth";
import {mongodbAdapter} from "better-auth/adapters/mongodb";
import {nextCookies} from "better-auth/next-js";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {createEmailAuthOptions} from "./email/auth-options";
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
  // A verified Google email may join its matching, already-verified local identity.
  // No other provider is trusted and a different email can never be linked implicitly.
  account:{accountLinking:{enabled:true,trustedProviders:["google"],requireLocalEmailVerified:true,allowDifferentEmails:false}},
  socialProviders:{google:{clientId:process.env.GOOGLE_CLIENT_ID||process.env.AUTH_GOOGLE_ID||"",clientSecret:process.env.GOOGLE_CLIENT_SECRET||process.env.AUTH_GOOGLE_SECRET||""}},
  plugins:[nextCookies()],
});
type SessionUser=NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["user"]&{role:UserRole};
export async function getSessionUser(){
  const requestHeaders=await headers();
  await connectMongoClient();
  const session=await auth.api.getSession({headers:requestHeaders});
  return session?.user as SessionUser|undefined;
}
export async function getCurrentUser(){const user=await getSessionUser();return user?.emailVerified?user:undefined;}
export async function getPostLoginDestination(user:{id:string;role:string},callback?:unknown) {
  if(user.role==="ADMIN") return postLoginDestination(user.role,false,callback);
  await connectMongoose();
  return postLoginDestination(user.role,!!await VendorProfileModel.exists({userId:user.id}),callback);
}
export async function requireUser(next="/dashboard"){
  const user=await getSessionUser();
  if(!user){const path=(await headers()).get("x-carxsailor-path");const intended=path&&(path===next||path.startsWith(next+"/")||path.startsWith(next+"?"))?path:next;redirect("/login?next="+encodeURIComponent(safeNext(intended)));}
  if(!user.emailVerified)redirect("/verify-email?email="+encodeURIComponent(user.email));
  return user;
}
export async function requireAdmin(){const user=await requireUser("/admin");if(user.role!=="ADMIN")redirect(await getPostLoginDestination(user));return user;}
export async function requireVendor(){const user=await requireUser("/vendor");if(user.role==="ADMIN")redirect("/admin");await connectMongoose();if(!await VendorProfileModel.exists({userId:user.id,status:"APPROVED"}))redirect("/become-a-vendor");return user;}
