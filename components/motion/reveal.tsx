"use client";
import {useEffect,useRef} from "react";
import {useAnimate,useInView} from "motion/react";
import {premiumEase,timing} from "@/lib/motion";
import {useMotionPolicy} from "./use-motion-policy";
type Family="rise"|"image"|"panel"|"left"|"right"|"fade";
export function Reveal({children,className="",family="rise",delay=0,hero=false}:{children:React.ReactNode;className?:string;family?:Family;delay?:number;hero?:boolean}){
  const[scope,animate]=useAnimate();const seen=useRef(false);const inView=useInView(scope,{once:true,amount:family==="panel"?.12:.22});const{reduced,desktop}=useMotionPolicy();
  useEffect(()=>{if(!inView||seen.current)return;seen.current=true;const distance=desktop?20:10;const movement=reduced||family==="fade"?{}:family==="image"?{clipPath:["inset(0 12% 0 0 round 16px)","inset(0 0% 0 0 round 16px)"],scale:[1.035,1]}:family==="panel"?{clipPath:["inset(2% 1% round 24px)","inset(0% 0% round 24px)"],scale:[.985,1]}:family==="left"||family==="right"?{x:[family==="left"?-distance:distance,0]}:{y:[distance,0]};const control=animate(scope.current,{opacity:[reduced?.8:.5,1],...movement},{duration:reduced?.16:hero?timing.hero:timing.reveal,ease:premiumEase,delay:reduced?0:delay});return()=>control.complete()},[inView,animate,scope,reduced,desktop,family,delay,hero]);
  return <div ref={scope} className={`motion-reveal ${className}`}>{children}</div>
}
export function TextReveal({lines,as:Tag="h2",className="",hero=false}:{lines:string[];as?:"h1"|"h2"|"h3";className?:string;hero?:boolean}){
  const[scope,animate]=useAnimate();const inView=useInView(scope,{once:true,amount:.35});const played=useRef(false);const{reduced}=useMotionPolicy();
  useEffect(()=>{if(!inView||played.current)return;played.current=true;const controls=Array.from(scope.current.querySelectorAll(".text-reveal-line")).map((node,i)=>animate(node as HTMLElement,reduced?{opacity:[.8,1]}:{y:["105%","0%"],opacity:[.7,1]},{duration:reduced?.15:hero?.85:.65,ease:premiumEase,delay:reduced?0:(hero?.12:0)+i*.09}));return()=>controls.forEach(control=>control.complete())},[inView,animate,scope,hero,reduced]);
  return <Tag ref={scope} aria-label={lines.join(" ")} className={className}>{lines.map((line,i)=><span className="text-reveal-mask" aria-hidden="true" key={i}><span className="text-reveal-line">{line}</span></span>)}</Tag>
}
