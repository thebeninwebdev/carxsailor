"use client";
import {LogOut} from "lucide-react";
import {signOut} from "@/lib/auth-client";
export function SignOutButton(){
  return <button onClick={()=>signOut({redirectTo:"/"})} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50"><LogOut size={15}/>Sign out</button>;
}
