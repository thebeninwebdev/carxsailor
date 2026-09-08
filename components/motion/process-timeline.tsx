"use client";
import {useRef} from "react";
import {useScroll,useSpring,useTransform,type MotionValue} from "motion/react";
import * as m from "motion/react-m";
import {settle} from "@/lib/motion";
import {useMotionPolicy} from "./use-motion-policy";
const steps=[["Tell us what you need","Set your budget, vehicle requirements and priorities."],["Narrow the field","Cars must meet your requirements before their available ratings are weighed."],["Understand your matches","See fit scores, strengths, weaker areas and missing information."],["Compare. Then save.","Examine finalists side by side. Sign in when you want to keep cars or decisions."]];
function Step({index,progress,reduced}:{index:number;progress:MotionValue<number>;reduced:boolean}){const color=useTransform(progress,[index*.2,index*.2+.15],["#86957e","#25452b"]);return <li><m.span style={{color:reduced?"#25452b":color}}>0{index+1}</m.span><h3>{steps[index][0]}</h3><p>{steps[index][1]}</p></li>}
export function ProcessTimeline(){const ref=useRef<HTMLDivElement>(null);const{reduced}=useMotionPolicy();const{scrollYProgress}=useScroll({target:ref,offset:["start .85","end .45"]});const progress=useSpring(scrollYProgress,settle);return <div ref={ref} className="process-timeline"><span className="timeline-track" aria-hidden><m.span style={{scaleX:reduced?1:progress}}/></span><ol className="process-grid">{steps.map((_,index)=><Step key={index} {...{index,progress,reduced}}/>)}</ol></div>}
