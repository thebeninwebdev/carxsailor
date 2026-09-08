"use client";
import {Children,useEffect,useRef} from "react";
import {useAnimate,useInView,stagger} from "motion/react";
import {revealEase,timing,revealMotion} from "@/lib/motion";
import {useMotionPolicy} from "./use-motion-policy";
export function Stagger({children,className="",as:Tag="div"}:{children:React.ReactNode;className?:string;as?:"div"|"ol"|"ul"}){const[scope,animate]=useAnimate();const inView=useInView(scope,{once:true,amount:.15});const played=useRef(false);const{reduced,desktop}=useMotionPolicy();useEffect(()=>{if(!inView||played.current)return;played.current=true;const control=animate(Array.from(scope.current.children),reduced?{opacity:[.85,1]}:{opacity:[0,1],y:[desktop?60:32,0]},{duration:reduced?.15:desktop?timing.reveal:.8,ease:revealEase,delay:reduced?0:stagger(desktop?revealMotion.desktopStagger:revealMotion.mobileStagger)});return()=>control.complete()},[inView,animate,scope,reduced,desktop]);return <Tag ref={scope} className={className}>{Children.toArray(children)}</Tag>}
