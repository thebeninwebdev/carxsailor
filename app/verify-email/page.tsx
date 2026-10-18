import type {Metadata} from "next";
import Link from "next/link";
import {getPostLoginDestination,getSessionUser} from "@/lib/auth";
export const metadata:Metadata={title:"Verify email",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function Page(){
  const user=await getSessionUser();
  return <div className="container grid min-h-[70vh] place-items-center py-14"><div className="card w-full max-w-md p-7 sm:p-9"><p className="eyebrow">Account security</p><h1 className="display mt-3 text-4xl">{user?"Email verified.":"Use a sign-in link."}</h1><p className="my-6 text-sm text-[#68756f]">{user?"Your email was verified when you signed in.":"Email magic links verify your address securely when you sign in."}</p>{user?<Link className="btn btn-dark" href={await getPostLoginDestination(user)}>Continue to your workspace</Link>:<Link className="btn btn-dark" href="/login">Send me a sign-in link</Link>}</div></div>;
}
