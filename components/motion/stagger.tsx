"use client";
import {Children,useEffect,useRef} from "react";
import {useAnimate,useInView,stagger} from "motion/react";
import {premiumEase,timing} from "@/lib/motion";
import {useMotionPolicy} from "./use-motion-policy";
export function Stagger({children,className="",as:Tag="div"}:{children:React.ReactNode;className?:string;as?:"div"|"ol"|"ul"}){const[scope,animate]=useAnimate();const inView=useInView(scope,{once:true,amount:.15});const played=useRef(false);const{reduced,desktop}=useMotionPolicy();useEffect(()=>{if(!inView||played.current)return;played.current=true;const control=animate(Array.from(scope.current.children),reduced?{opacity:[.85,1]}:{opacity:[.55,1],y:[desktop?14:8,0]},{duration:reduced?.15:timing.standard,ease:premiumEase,delay:reduced?0:stagger(desktop?.06:.035)});return()=>control.complete()},[inView,animate,scope,reduced,desktop]);return <Tag ref={scope} className={className}>{Children.toArray(children)}</Tag>}
