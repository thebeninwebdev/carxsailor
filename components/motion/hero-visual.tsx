"use client";
import {useRef} from "react";
import {useScroll,useTransform,useSpring,useMotionValue} from "motion/react";
import * as m from "motion/react-m";
import {settle} from "@/lib/motion";
import {useMotionPolicy} from "./use-motion-policy";
import {Reveal} from "./reveal";
export function HeroVisual({image,children,closing=false}:{image:React.ReactNode;children:React.ReactNode;closing?:boolean}){const ref=useRef<HTMLDivElement>(null);const{depth}=useMotionPolicy();const{scrollYProgress}=useScroll({target:ref,offset:["start start","end start"]});const y=useTransform(scrollYProgress,[0,1],[0,35]);const scale=useTransform(scrollYProgress,[0,1],[1,1.035]);const labelY=useTransform(scrollYProgress,[0,1],[0,-12]);const pointer=useMotionValue(0);const pan=useSpring(pointer,settle);return <Reveal family={closing?"panel":"image"} hero={!closing} delay={closing?0:.2}><div ref={ref} className={closing?"final-cta":"hero-visual"} onPointerMove={e=>{if(!depth||e.pointerType!=="mouse")return;const r=e.currentTarget.getBoundingClientRect();pointer.set(((e.clientX-r.left)/r.width-.5)*10)}} onPointerLeave={()=>pointer.set(0)}><m.div className="hero-image-layer" style={{y:depth?y:0,scale:depth?scale:1,x:depth?pan:0}}>{image}</m.div><div className="hero-shade"/><m.div className="hero-content-layer" style={{y:depth?labelY:0}}>{children}</m.div></div></Reveal>}
