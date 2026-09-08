"use client";
import {useRouter} from "next/navigation";

import {AnimatePresence} from "motion/react";
import * as m from "motion/react-m";
import {useMotionPolicy} from "@/components/motion/use-motion-policy";
import {timing} from "@/lib/motion";
import Link from "next/link";
import {useSyncExternalStore} from "react";
const key="carxsailor-compare";
function subscribe(callback:()=>void){window.addEventListener("storage",callback);window.addEventListener("compare-change",callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener("compare-change",callback)}}
function snapshot(){try{return localStorage.getItem(key)||"[]"}catch{return "[]"}}
export function useCompare(){const router=useRouter();const raw=useSyncExternalStore(subscribe,snapshot,()=>"[]");let ids:string[]=[];try{const parsed=JSON.parse(raw);if(Array.isArray(parsed))ids=parsed.filter(x=>typeof x==="string").slice(0,3)}catch{}return {ids,toggle:(id:string)=>{const next=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id].slice(0,3);try{localStorage.setItem(key,JSON.stringify(next));window.dispatchEvent(new Event("compare-change"))}catch{router.push(`/compare?cars=${encodeURIComponent(id)}`)}}}}
export function CompareButton({vehicleId}:{vehicleId:string}){const{reduced}=useMotionPolicy();const{ids,toggle}=useCompare();const selected=ids.includes(vehicleId);return <div className="mt-3 flex flex-wrap items-center gap-3 text-sm"><m.button whileTap={reduced?undefined:{scale:.98}} animate={{backgroundColor:selected?"#edf3df":"#ffffff"}} transition={{duration:timing.micro}} className="btn btn-light disabled:opacity-50" disabled={!selected&&ids.length>=3} aria-pressed={selected} onClick={()=>toggle(vehicleId)}>{selected?"Remove from compare":"Add to compare"}</m.button><AnimatePresence initial={false}>{ids.length>0&&<m.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><Link className="underline underline-offset-4" href={`/compare?cars=${ids.join(",")}`}>Compare ({ids.length}/3)</Link></m.span>}</AnimatePresence>{!selected&&ids.length>=3&&<span>Remove a car to add another.</span>}</div>}
