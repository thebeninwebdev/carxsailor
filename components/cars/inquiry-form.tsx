"use client";
import {MessageCircle} from "lucide-react";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {inquiryAction} from "@/lib/buyer-actions";
import {buildWhatsAppInquiryUrl} from "@/lib/whatsapp";

type InquiryVehicle={year:number;make:string;model:string;price:string};
type InquiryFormProps={vehicleId:string;vehicle:InquiryVehicle;listingUrl:string};

export function InquiryForm({vehicleId,vehicle,listingUrl}:InquiryFormProps){
  const router=useRouter();
  const locked=useRef(false);
  const [state,setState]=useState<"idle"|"sending"|"sent">("idle");
  const [error,setError]=useState("");
  const [reference,setReference]=useState<string>();
  const whatsappUrl=buildWhatsAppInquiryUrl({vehicle,listingUrl,inquiryReference:reference});
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
      setReference(result.data.reference);
      setState("sent");
    }catch(error){setState("idle");setError(error instanceof Error?error.message:"Could not send your inquiry. Try again.");}
    finally{locked.current=false;}
  }
  if(state==="sent")return <div role="status" className="mt-5 rounded-xl bg-green-50 p-5 text-green-900"><p className="font-bold">Inquiry sent successfully</p><p className="mt-1 text-sm">We have received your inquiry and will get back to you. Your reference is <b>{reference}</b>.</p><div className="mt-4 border-t border-green-200 pt-4"><p className="text-sm font-bold">Need a faster response?</p><p className="mt-1 text-sm font-normal">Contact the CarXSailor team directly and we will include your inquiry reference.</p><a className="btn btn-dark mt-3 w-full" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={17}/>Fast-track on WhatsApp</a></div></div>;
  return <><form onSubmit={submit} className="mt-5 grid gap-3"><select disabled={state==="sending"} name="kind" className="input"><option value="AVAILABILITY">Ask about availability</option><option value="INSPECTION">Request inspection</option><option value="VIEWING">Request a viewing</option><option value="QUESTION">Ask a question</option></select><textarea disabled={state==="sending"} name="message" maxLength={1500} className="input min-h-24" placeholder="Add a message (optional)"/>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={state==="sending"} className="btn btn-primary">{state==="sending"?"Sending inquiry...":"Send inquiry"}</button></form><div className="mt-5 border-t border-[#e4e9e5] pt-5"><p className="text-sm font-bold">Need a faster response?</p><p className="mt-1 text-sm text-[#68756f]">Contact the CarXSailor team directly on WhatsApp about this car.</p><a className="btn btn-light mt-3 w-full" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={17}/>Fast-track on WhatsApp</a></div></>;
}