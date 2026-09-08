"use client";
import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import {useMotionValue,useSpring} from "motion/react";
import * as m from "motion/react-m";
import {responsive} from "@/lib/motion";
import {useMotionPolicy} from "./use-motion-policy";
export function MotionCTA({href,children,className="btn-dark",magnetic=false}:{href:string;children:string;className?:string;magnetic?:boolean}){const{depth,reduced}=useMotionPolicy();const x=useMotionValue(0),y=useMotionValue(0);const smoothX=useSpring(x,responsive),smoothY=useSpring(y,responsive);return <m.span className="motion-cta-shell" style={{x:depth?smoothX:0,y:depth?smoothY:0}} onPointerMove={e=>{if(!depth||!magnetic||e.pointerType!=="mouse")return;const r=e.currentTarget.getBoundingClientRect();x.set(((e.clientX-r.left)/r.width-.5)*10);y.set(((e.clientY-r.top)/r.height-.5)*6)}} onPointerLeave={()=>{x.set(0);y.set(0)}} whileTap={reduced?undefined:{scale:.985}}><Link className={`btn motion-cta ${className}`} href={href}><span className="cta-sweep" aria-hidden/><span className="cta-label">{children}</span><ArrowUpRight size={18} className="cta-arrow" aria-hidden/></Link></m.span>}
