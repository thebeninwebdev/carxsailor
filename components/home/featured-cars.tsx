"use client";
import {AnimatePresence,LayoutGroup,useInView} from "motion/react";
import * as m from "motion/react-m";
import {directional,settle} from "@/lib/motion";
import {useMotionPolicy} from "@/components/motion/use-motion-policy";
import {TextReveal} from "@/components/motion/reveal";
import {useEffect,useRef,useState,useSyncExternalStore} from "react";
import {Pause,Play} from "lucide-react";
import Link from "next/link";
import type {Vehicle} from "@/types";
import {VehicleImage} from "@/components/cars/vehicle-image";
import {CompareButton} from "@/components/cars/compare-button";
import {money} from "@/lib/utils";
const AUTOPLAY_DELAY=6000;
function subscribeVisibility(callback:()=>void){document.addEventListener("visibilitychange",callback);return()=>document.removeEventListener("visibilitychange",callback)}
const visibleSnapshot=()=>document.visibilityState==="visible";
export function FeaturedCars({vehicles}:{vehicles:Vehicle[]}){
  const[index,setIndex]=useState(0);
  const[direction,setDirection]=useState(1);
  const[paused,setPaused]=useState(false);
  const[hovered,setHovered]=useState(false);
  const[focused,setFocused]=useState(false);
  const section=useRef<HTMLElement>(null);
  const inView=useInView(section,{amount:.25});
  const tabVisible=useSyncExternalStore(subscribeVisibility,visibleSnapshot,()=>true);
  const{reduced}=useMotionPolicy();
  const canPlay=vehicles.length>1&&!paused&&!hovered&&!focused&&!reduced&&inView&&tabVisible;
  useEffect(()=>{
    if(!canPlay||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const timer=window.setTimeout(()=>{setDirection(1);setIndex(current=>(current+1)%vehicles.length)},AUTOPLAY_DELAY);
    return()=>window.clearTimeout(timer);
  },[canPlay,index,vehicles.length]);
  const car=vehicles[index];
  return <section ref={section} className="section-space container" aria-label="Featured cars" onPointerEnter={e=>{if(e.pointerType==="mouse")setHovered(true)}} onPointerLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false)}}><div className="section-heading"><div><p className="eyebrow">The shortlist starts here</p><TextReveal lines={["Worth a closer look."]}/></div><div className="flex flex-wrap items-center gap-5">{vehicles.length>1&&!reduced&&<button type="button" className="btn btn-light text-sm" onClick={()=>setPaused(value=>!value)} aria-label={paused?"Resume automatic car rotation":"Pause automatic car rotation"}>{paused?<Play size={15} aria-hidden/>:<Pause size={15} aria-hidden/>}{paused?"Resume":"Pause"}</button>}<Link className="text-link" href="/cars">Discover all cars ↗</Link></div></div>{car?<div className="featured-layout"><LayoutGroup id="featured-selection"><div className="vehicle-selector" aria-label="Featured vehicles">{vehicles.map((v,i)=><button key={v.id} onClick={()=>{setDirection(i>index?1:-1);setIndex(i)}} aria-pressed={index===i}>{index===i&&<m.span className="featured-active" layoutId="active-car" transition={settle}/>}<span className="technical">0{i+1}</span><span className="featured-name">{v.make}<strong>{v.model}</strong></span><span>↗</span></button>)}</div></LayoutGroup><AnimatePresence initial={false} mode="wait" custom={direction}><m.article key={car.id} custom={direction} variants={directional(reduced,32)} initial="enter" animate="center" exit="exit" className="featured-car"><div className="relative aspect-[16/9]"><VehicleImage vehicle={car}/><span className="image-label">{car.year} / {car.bodyType}</span></div><div className="featured-details"><div><p className="eyebrow">{car.location.city} · {car.isDemo?"Sample listing":"Available listing"}</p><h3 className="mt-2 text-3xl font-bold tracking-tight">{car.make} {car.model}</h3><p className="mt-2 text-xl">{money(car.price)}</p></div><dl className="flex gap-8"><div><dt>Reliability</dt><dd>{car.reliabilityRating??"—"}<small>/100</small></dd></div><div><dt>Fuel economy</dt><dd>{car.fuelEconomyRating??"—"}<small>/100</small></dd></div></dl></div><div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-6"><Link href={`/cars/${car.slug}`} className="btn btn-dark">View car ↗</Link><CompareButton vehicleId={car.id}/></div><p className="px-6 pb-5 text-xs text-[#69756f]">Listing ratings, not measured consumption. Check condition evidence on the car page.</p></m.article></AnimatePresence></div>:<p className="py-12">No active listings yet. You can still explore the decision guide.</p>}</section>}
