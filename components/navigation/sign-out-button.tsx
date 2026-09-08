"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {LogOut} from "lucide-react";
import {signOut} from "@/lib/auth-client";
export function SignOutButton(){const router=useRouter();const[pending,setPending]=useState(false);const[error,setError]=useState("");return <div><button type="button" disabled={pending} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50" onClick={async()=>{setPending(true);setError("");try{const result=await signOut();if(result.error)throw new Error("Please try signing out again.");router.replace("/");router.refresh()}catch{setError("Could not sign out. Please try again.")}finally{setPending(false)}}}><LogOut size={15}/>{pending?"Signing out...":"Sign out"}</button>{error&&<p role="alert" className="p-3 text-xs text-red-700">{error}</p>}</div>}
