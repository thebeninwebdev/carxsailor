"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import * as m from "motion/react-m";
import {Heart} from "lucide-react";
import {useSession} from "@/lib/auth-client";
import {favoriteAction} from "@/lib/buyer-actions";
import {useMotionPolicy} from "@/components/motion/use-motion-policy";
import {timing} from "@/lib/motion";
export function FavoriteButton({vehicleId}:{vehicleId:string}){
  const {reduced}=useMotionPolicy();const router=useRouter();const {data:session,isPending}=useSession();
  const userId=session?.user.id;
  const key=(userId??"")+":"+vehicleId;
  const [status,setStatus]=useState({key:"",saved:false});
  const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  const locked=useRef(false);
  const saved=status.key===key&&status.saved;
  useEffect(()=>{
    if(!userId)return;
    let active=true;
    const controller=new AbortController();
    async function load(){
      try{
        let resume=false;
        try{resume=sessionStorage.getItem("carxsailor-pending-save")===vehicleId;}catch{/* Optional browser storage. */}
        if(resume){
          const result=await favoriteAction(vehicleId,true);
          if(!result.success)throw new Error(result.error);
          try{sessionStorage.removeItem("carxsailor-pending-save");}catch{/* Save is already persisted. */}
          if(active)setStatus({key,saved:result.data.saved});
        }else{
          const response=await fetch("/api/favorites?vehicleId="+encodeURIComponent(vehicleId),{cache:"no-store",signal:controller.signal});
          if(!response.ok)throw new Error("Could not check saved status.");
          const data=await response.json() as {saved:boolean};
          if(active)setStatus({key,saved:data.saved});
        }
      }catch(error){if(active){setError(error instanceof Error?error.message:"Could not check saved status.");setStatus({key,saved:false});}}
    }
    void load();
    return()=>{active=false;controller.abort();};
  },[vehicleId,userId,key]);
  async function toggle(){
    if(locked.current)return;
    if(!session){
      try{sessionStorage.setItem("carxsailor-pending-save",vehicleId);}catch{/* Returning users can save manually. */}
      router.push("/login?next="+encodeURIComponent(window.location.pathname+window.location.search));return;
    }
    locked.current=true;setBusy(true);setError("");
    try{
      const result=await favoriteAction(vehicleId,!saved);
      if(!result.success){
        if(result.status===401)router.push("/login?next="+encodeURIComponent(window.location.pathname+window.location.search));
        throw new Error(result.error);
      }
      setStatus({key,saved:result.data.saved});
    }catch(error){setError(error instanceof Error?error.message:"Could not update saved cars. Try again.");}
    finally{locked.current=false;setBusy(false);}
  }
  return <div><m.button data-vehicle-id={vehicleId} type="button" whileTap={reduced?undefined:{scale:.97}} disabled={busy||isPending||!!userId&&status.key!==key} onClick={toggle} aria-label={saved?"Remove saved car":"Save car"} title={saved?"Remove saved car":"Save car"} aria-pressed={saved} className="grid h-11 w-11 place-items-center rounded-full border border-[#dce2dd] bg-white text-[#163f31] disabled:opacity-50"><m.span key={saved?"saved":"unsaved"} animate={saved&&!reduced?{scale:[1,1.12,1]}:{scale:1}} transition={{duration:timing.micro}}><Heart size={18} fill={saved?"currentColor":"none"}/></m.span></m.button>{error&&<span role="alert" className="block max-w-40 rounded bg-white p-2 text-xs text-red-800">{error}</span>}</div>;
}
