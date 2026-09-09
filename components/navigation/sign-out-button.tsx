"use client";
import {unstable_rethrow} from "next/navigation";
import {useActionState} from "react";
import {LogOut} from "lucide-react";
import {signOut} from "@/lib/auth-client";
import {completeSignOut} from "@/lib/actions";
import type {ActionState} from "@/lib/mutation-result";
export function SignOutButton(){
  const [state,action,pending]=useActionState<ActionState,FormData>(async()=>{
    try{const result=await signOut();if(result.error)return {error:"Could not sign out. Please try again."};}
    catch{return {error:"Could not sign out. Please try again."};}
    try{return await completeSignOut();}catch(error){unstable_rethrow(error);return {error:"Could not verify sign-out. Please try again."};}
  },{});
  return <form action={action}><button disabled={pending} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"><LogOut size={15}/>{pending?"Signing out...":"Sign out"}</button>{state.error&&<p role="alert" className="p-3 text-xs text-red-700">{state.error}</p>}</form>;
}
