"use client";
import Link from "next/link";
import {unstable_rethrow} from "next/navigation";
import {useActionState,useRef} from "react";
import {signIn,signUp} from "@/lib/auth-client";
import {safeNext} from "@/lib/safe-next";
import {completeSignIn} from "@/lib/actions";
import type {ActionState} from "@/lib/mutation-result";
export function AuthForm({mode,redirectTo=""}:{mode:"login"|"register";redirectTo?:string}){
  const destination=safeNext(redirectTo,"");
  const locked=useRef(false);
  const [state,action,pending]=useActionState<ActionState,FormData>(async (_previous,form)=>{
    try{
      const email=String(form.get("email")),password=String(form.get("password"));
      const result=mode==="login"?await signIn.email({email,password}):await signUp.email({email,password,name:String(form.get("name"))});
      if(result.error){locked.current=false;return {error:result.error.message||"Authentication failed."};}
    }catch{
      locked.current=false;return {error:"Could not sign in. Check your connection and try again."};
    }
    // This action verifies the cookie on the server, invalidates the router cache,
    // then redirects once. Keep the redirect outside the authentication catch.
    try{return await completeSignIn(destination);}
    catch(error){unstable_rethrow(error);return {error:"Could not verify your session. Please try again."};}
    finally{locked.current=false;}
  },{});
  const other=(mode==="login"?"/register":"/login")+(destination?"?next="+encodeURIComponent(destination):"");
  return <form action={action} onReset={event=>event.preventDefault()} onSubmit={event=>{if(locked.current||pending)event.preventDefault();else locked.current=true;}} className="grid gap-4">
    {mode==="register"&&<label><span className="label">Full name</span><input disabled={pending} className="input" name="name" minLength={2} required autoComplete="name"/></label>}
    <label><span className="label">Email address</span><input disabled={pending} className="input" name="email" type="email" required autoComplete="email"/></label>
    <label><span className="label">Password</span><input disabled={pending} className="input" name="password" type="password" minLength={8} required autoComplete={mode==="login"?"current-password":"new-password"}/></label>
    {mode==="login"&&<Link className="text-sm font-bold text-[#245c47]" href="/forgot-password">Forgot password?</Link>}
    {state.error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
    <button disabled={pending} className="btn btn-dark">{pending?(mode==="login"?"Signing in...":"Creating account..."):mode==="login"?"Sign in":"Create account"}</button>
    <p className="text-center text-sm text-[#68756f]">{mode==="login"?"New to CarXSailor? ":"Already have an account? "}<Link className="font-bold text-[#245c47]" href={other}>{mode==="login"?"Create account":"Sign in"}</Link></p>
  </form>;
}
