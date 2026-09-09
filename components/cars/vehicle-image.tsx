import Image from "next/image";
import type { Vehicle } from "@/types";
export function VehicleImage({vehicle,preload=false,imageIndex=0,fit="cover",sizes="(max-width: 768px) 100vw, 60vw"}:{vehicle:Pick<Vehicle,"images"|"title"|"isDemo">;preload?:boolean;imageIndex?:number;fit?:"cover"|"contain";sizes?:string}) {
  const src=vehicle.images[imageIndex]?.url;
  if(!src) return <div className="grid h-full place-items-center bg-[#e1e4df] text-[#526057]">Photo unavailable</div>;
  const optimized=src.startsWith("/")||/^https:\/\/(images\.unsplash\.com|res\.cloudinary\.com)\//.test(src);
  return <><Image src={src} alt={vehicle.isDemo?"Illustrative automotive photo; not the actual listed vehicle":vehicle.images[imageIndex]?.alt||vehicle.title} fill loading={preload?"eager":"lazy"} fetchPriority={preload?"high":undefined} sizes={sizes} unoptimized={!optimized} className={fit==="contain"?"object-contain":"object-cover"}/>{vehicle.isDemo&&<span className="absolute bottom-2 right-2 z-10 rounded bg-black/75 px-2 py-1 text-[10px] text-white">Sample listing · illustrative photo</span>}</>;
}
