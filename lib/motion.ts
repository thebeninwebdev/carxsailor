import type {Transition,Variants} from "motion/react";

export const premiumEase=[.22,1,.36,1] as const;
export const fastEase=[.2,.7,.2,1] as const;
export const timing={micro:.22,standard:.48,reveal:.78,hero:1.05,exit:.16};
export const settle:Transition={type:"spring",stiffness:330,damping:36,mass:.8};
export const responsive:Transition={type:"spring",stiffness:440,damping:38,mass:.65};
export const standard:Transition={duration:timing.standard,ease:premiumEase};
export const staggerVariants:Variants={rest:{},show:{transition:{staggerChildren:.065}}};
export const itemVariants:Variants={rest:{opacity:.55,y:12},show:{opacity:1,y:0,transition:standard}};
export function directional(reduced:boolean,distance=24):Variants{return {enter:(direction:number)=>({opacity:0,x:reduced?0:direction*distance,scale:reduced?1:1.015}),center:{opacity:1,x:0,scale:1,transition:standard},exit:(direction:number)=>({opacity:0,x:reduced?0:-direction*distance,scale:reduced?1:.99,transition:{duration:timing.exit,ease:fastEase}})}}
