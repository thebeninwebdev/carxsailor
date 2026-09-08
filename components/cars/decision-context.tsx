"use client";
import {useSyncExternalStore} from "react";
import {Reveal} from "@/components/motion/reveal";
import Link from "next/link";
import type {AdviserResponse,AdviserRecommendation} from "@/lib/ai/types";
const subscribe=()=>()=>{};
function read(){try{return sessionStorage.getItem("carxsailor-results")||"null"}catch{return "null"}}
export function DecisionContext({vehicleId}:{vehicleId:string}){const raw=useSyncExternalStore(subscribe,read,()=>"null");let match:AdviserRecommendation|null=null;try{const data:AdviserResponse=JSON.parse(raw);match=data?.recommendations?.find(r=>r.vehicleId===vehicleId)??null}catch{}if(!match)return null;return <Reveal family="fade"><section className="mt-8 rounded-2xl bg-[#eaf0e3] p-6"><h2 className="text-xl font-bold">Why this matches you</h2><p className="mt-2 text-sm">From your latest decision in this tab · {match.score}/100 fit score</p><ul className="mt-4 grid gap-2 text-sm">{match.reasons.map(x=><li key={x}>+ {x}</li>)}{match.tradeOffs.map(x=><li key={x}>− {x}</li>)}</ul><Link href="/car-adviser?resume=1#results" className="mt-5 inline-block font-bold underline">Back to my decision</Link></section></Reveal>}
