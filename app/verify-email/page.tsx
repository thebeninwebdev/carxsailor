import type {Metadata} from "next";
import Link from "next/link";
import {EmailForm} from "@/components/auth/email-forms";
import {requireUser} from "@/lib/auth";
export const metadata:Metadata={title:"Verify email",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Page({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const [user,query]=await Promise.all([requireUser("/verify-email"),searchParams]);
  return <div className="container grid min-h-[70vh] place-items-center py-14"><div className="card w-full max-w-md p-7 sm:p-9">
    <p className="eyebrow">Account security</p><h1 className="display mt-3 text-4xl">{user.emailVerified?"Email verified.":"Verify your email."}</h1>
    <p className="my-6 text-sm text-[#68756f]">{user.emailVerified?"Your email address has been confirmed.":"Confirm your email address using the secure link we send to your inbox."}</p>
    {query.error&&!user.emailVerified&&<p role="alert" className="mb-4 text-sm text-red-800">This verification link is invalid or expired. Request a new one below.</p>}
    {user.emailVerified?<Link className="btn btn-dark" href="/dashboard">Continue to My Garage</Link>:<EmailForm mode="verify" email={user.email}/>}
  </div></div>;
}
