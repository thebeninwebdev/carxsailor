"use client";
import Link from "next/link";
import {useActionState, useRef} from "react";
import {authClient} from "@/lib/auth-client";

type Result = {error?:string; message?:string; done?:boolean};
type Props = {mode:"forgot" | "reset" | "verify"; email?:string; token?:string};
export function EmailForm({mode,email,token}:Props) {
  const locked=useRef(false);
  const [state,action,pending]=useActionState<Result,FormData>(async (_previous,form)=>{
    try {
      if(mode==="forgot") {
        const result=await authClient.requestPasswordReset({
          email:String(form.get("email")),
          redirectTo:"/reset-password",
        });
        if(result.error) return {error:result.error.message || "Could not request a reset email. Please try again."};
        return {message:"If an account exists with that email, a password reset link has been sent. Check your inbox."};
      }
      if(mode==="verify") {
        const verificationEmail=String(form.get("email")||email||"");
        const result=await authClient.sendVerificationEmail({email:verificationEmail,callbackURL:"/verify-email"});
        if(result.error) return {error:result.error.message || "Could not send the verification email. Please try again."};
        return {message:"Verification email sent. Open the new link in your inbox to verify your address.",done:true};
      }
      const password=String(form.get("password"));
      if(password!==String(form.get("confirmPassword"))) return {error:"The passwords do not match."};
      if(!token) return {error:"This reset link is invalid. Request a new one."};
      const result=await authClient.resetPassword({newPassword:password,token});
      if(result.error) return {error:result.error.message || "This reset link may have expired. Request a new one."};
      return {message:"Your password has been reset. Sign in with your new password.",done:true};
    } catch {
      return {error:"Could not complete the request. Check your connection and try again."};
    } finally { locked.current=false; }
  },{});
  return <form action={action} className="grid gap-4" onReset={event=>event.preventDefault()} onSubmit={event=>{
    if(locked.current||pending)event.preventDefault();else locked.current=true;
  }}>
    {mode==="forgot"&&<label><span className="label">Email address</span><input className="input" type="email" name="email" autoComplete="email" required disabled={pending}/></label>}
    {mode==="verify"&&<label><span className="label">Email address</span><input className="input" type="email" name="email" defaultValue={email} autoComplete="email" required disabled={pending}/></label>}
    {mode==="reset"&&!state.done&&<>
      <label><span className="label">New password</span><input className="input" type="password" name="password" minLength={8} maxLength={128} autoComplete="new-password" required disabled={pending}/></label>
      <label><span className="label">Confirm new password</span><input className="input" type="password" name="confirmPassword" minLength={8} maxLength={128} autoComplete="new-password" required disabled={pending}/></label>
    </>}
    {state.error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
    {state.message&&<p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-900">{state.message}</p>}
    {!state.done&&<button className="btn btn-dark" disabled={pending}>{pending?"Please wait...":mode==="forgot"?"Send reset link":mode==="verify"?"Resend verification email":"Reset password"}</button>}
    <Link className="text-sm font-bold text-[#245c47]" href="/login">Back to sign in</Link>
    {mode==="reset"&&state.error&&<Link className="text-sm font-bold text-[#245c47]" href="/forgot-password">Request a new reset link</Link>}
  </form>;
}
