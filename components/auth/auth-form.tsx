"use client";
import Link from "next/link";
import {useState} from "react";
import {signIn} from "@/lib/auth-client";
import {safeNext} from "@/lib/safe-next";
export function AuthForm({mode,redirectTo=""}:{mode:"login"|"register";redirectTo?:string}){
  const destination=safeNext(redirectTo,"");
  const [pending,setPending]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  async function submit(form:FormData){
    setPending(true);setError("");setMessage("");
    try{
      await signIn("resend",{email:String(form.get("email")),redirect:false,redirectTo:destination||"/dashboard"});
      setMessage("Check your inbox for a secure sign-in link.");
    }catch{setError("We could not send a sign-in link. Please try again.");}
    finally{setPending(false);}
  }
  const other=(mode==="login"?"/register":"/login")+(destination?"?next="+encodeURIComponent(destination):"");
  return <div className="grid gap-4">
    <button type="button" disabled={pending} onClick={()=>signIn("google",{redirectTo:destination||"/dashboard"})} className="btn btn-light w-full">Continue with Google</button>
    <p className="text-center text-xs font-bold uppercase tracking-wider text-[#69756f]">or email link</p>
    <form action={submit} className="grid gap-4">
    <label><span className="label">Email address</span><input disabled={pending} className="input" name="email" type="email" required autoComplete="email"/></label>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {message&&<p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-900">{message}</p>}
    <button disabled={pending} className="btn btn-dark">{pending?"Sending link...":"Email me a sign-in link"}</button>
    </form>
    <p className="text-center text-sm text-[#68756f]">{mode==="login"?"New to CarXSailor? ":"Already have an account? "}<Link className="font-bold text-[#245c47]" href={other}>{mode==="login"?"Create account":"Sign in"}</Link></p>
  </div>;
}
