import type {Metadata} from "next";
import {EmailForm} from "@/components/auth/email-forms";
export const metadata:Metadata={title:"Forgot password",robots:{index:false,follow:false},referrer:"no-referrer"};
export default function Page() {
  return <div className="container grid min-h-[70vh] place-items-center py-14"><div className="card w-full max-w-md p-7 sm:p-9">
    <p className="eyebrow">Account recovery</p><h1 className="display mt-3 text-4xl">Forgot password?</h1>
    <p className="my-6 text-sm text-[#68756f]">Enter your account email to request a secure password reset link.</p><EmailForm mode="forgot"/>
  </div></div>;
}
