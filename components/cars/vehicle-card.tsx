import {VehicleCardMotion} from "@/components/motion/vehicle-card-motion";
import {VehicleImage} from "./vehicle-image";
import {CompareButton} from "./compare-button";
import Link from "next/link";
import {Gauge,MapPin,ShieldCheck} from "lucide-react";
import type {Vehicle} from "@/types";
import {compactNumber,money} from "@/lib/utils";
import {FavoriteButton} from "./favorite-button";

export function VehicleCard({vehicle,match,directDetails=false}:{vehicle:Vehicle;match?:number;directDetails?:boolean}){
  return <VehicleCardMotion>
    <div className="relative aspect-[16/10] bg-[#e8ece9]">
      <Link href={`/cars/${vehicle.slug}`} className="absolute inset-0" aria-label={`View details for ${vehicle.make} ${vehicle.model}`}><VehicleImage vehicle={vehicle} sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw"/></Link>
      <div className="absolute left-3 top-3 flex gap-2">{vehicle.isFeatured&&<span className="pill bg-[#d7f25c]">Featured</span>}{match!==undefined&&<span className="pill bg-[#163f31] text-white">{Math.round(match)}/100 fit score</span>}</div>
      <div className="absolute right-3 top-3"><FavoriteButton vehicleId={vehicle.id}/></div>
    </div>
    <div className="p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#718079]">{vehicle.year} / {vehicle.bodyType}</p><h3 className="mt-1 text-lg font-extrabold"><Link href={`/cars/${vehicle.slug}`}>{vehicle.make} {vehicle.model}</Link></h3></div><b className="text-lg">{money(vehicle.price)}</b></div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#66736d]"><span className="flex items-center gap-1"><Gauge size={14}/>{compactNumber(vehicle.mileage)} km</span><span>{vehicle.transmission}</span><span className="flex items-center gap-1"><MapPin size={14}/>{vehicle.location.city}</span></div>
      <div className="mt-4 flex items-center justify-between border-t border-[#e4e9e5] pt-4 text-xs"><span className="flex items-center gap-1 font-bold text-[#2c6c54]"><ShieldCheck size={15}/>{vehicle.inspectionStatus==="VERIFIED_INSPECTION"?"Verified inspection":vehicle.inspectionStatus==="VENDOR_REPORTED"?"Vendor reported":"Not inspected"}</span><span>Engine {vehicle.condition.engine ?? "-"}%</span></div>{directDetails?<a href={"/cars/"+encodeURIComponent(vehicle.slug)} className="btn btn-dark mt-4 w-full">View details</a>:<Link href={"/cars/"+vehicle.slug} className="btn btn-dark mt-4 w-full">View details</Link>}<CompareButton vehicleId={vehicle.id}/>
    </div>
  </VehicleCardMotion>
}


