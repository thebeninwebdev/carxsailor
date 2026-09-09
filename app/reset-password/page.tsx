import type {Metadata} from "next";
import Link from "next/link";
import {EmailForm} from "@/components/auth/email-forms";
export const metadata:Metadata={title:"Reset password",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Page({searchParams}:{searchParams:Promise<{token?:string;error?:string}>}) {
  const {token,error}=await searchParams;
  const valid=typeof token==="string"&&token.length>0&&!error;
  return <div className="container grid min-h-[70vh] place-items-center py-14"><div className="card w-full max-w-md p-7 sm:p-9">
    <p className="eyebrow">Account recovery</p><h1 className="display mt-3 text-4xl">Reset your password.</h1>
    <p className="my-6 text-sm text-[#68756f]">{valid?"Choose a password with at least eight characters.":"This reset link is missing, invalid, or expired."}</p>
    {valid?<EmailForm mode="reset" token={token}/>:<Link className="btn btn-dark" href="/forgot-password">Request a new reset link</Link>}
  </div></div>;
}
