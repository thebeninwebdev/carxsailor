import type {Metadata} from "next";
import {redirect} from "next/navigation";
import {AuthForm} from "@/components/auth/auth-form";
import {getPostLoginDestination,getSessionUser} from "@/lib/auth";
import {safeNext} from "@/lib/safe-next";

export const metadata:Metadata={title:"Log in",robots:{index:false,follow:false}};

export default async function Page({searchParams}:{searchParams:Promise<{next?:string;callbackUrl?:string}>}){
  const query=await searchParams;
  const user=await getSessionUser();
  // A visitor who is already signed in has no login flow to resume. Always
  // return that account to its own workspace instead of honoring a stale URL.
  if(user&&!user.emailVerified)redirect("/verify-email?email="+encodeURIComponent(user.email));
  if(user)redirect(await getPostLoginDestination(user));
  const next=safeNext(query.callbackUrl??query.next,"");
  return <div className="container grid min-h-[70vh] place-items-center py-14"><div className="card w-full max-w-md p-7 sm:p-9"><p className="eyebrow">Welcome back</p><h1 className="display mt-3 text-4xl">Continue your journey.</h1><p className="my-6 text-sm text-[#68756f]">Access your saved cars, conversations, or seller workspace.</p><AuthForm mode="login" redirectTo={next}/></div></div>;
}