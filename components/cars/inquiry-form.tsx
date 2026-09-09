"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {inquiryAction} from "@/lib/buyer-actions";
export function InquiryForm({vehicleId}:{vehicleId:string}){
  const router=useRouter();
  const locked=useRef(false);
  const [state,setState]=useState<"idle"|"sending"|"sent">("idle");
  const [error,setError]=useState("");
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(locked.current)return;
    locked.current=true;setState("sending");setError("");
    const form=new FormData(event.currentTarget);
    try{
      const result=await inquiryAction({vehicleId,kind:form.get("kind"),message:form.get("message")});
      if(!result.success){
        if(result.status===401)router.push("/login?next="+encodeURIComponent(window.location.pathname+window.location.search));
        throw new Error(result.error);
      }
      setState("sent");
    }catch(error){setState("idle");setError(error instanceof Error?error.message:"Could not send your inquiry. Try again.");}
    finally{locked.current=false;}
  }
  if(state==="sent")return <div role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-800">Inquiry sent. You can track it in your dashboard.</div>;
  return <form onSubmit={submit} className="mt-5 grid gap-3"><select disabled={state==="sending"} name="kind" className="input"><option value="AVAILABILITY">Ask about availability</option><option value="INSPECTION">Request inspection</option><option value="VIEWING">Request a viewing</option><option value="QUESTION">Ask a question</option></select><textarea disabled={state==="sending"} name="message" maxLength={1500} className="input min-h-24" placeholder="Add a message (optional)"/>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={state==="sending"} className="btn btn-primary">{state==="sending"?"Sending...":"Contact vendor"}</button></form>;
}
