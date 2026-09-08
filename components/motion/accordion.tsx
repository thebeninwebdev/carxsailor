"use client";
import {useState,useId} from "react";
import {AnimatePresence,LayoutGroup} from "motion/react";
import * as m from "motion/react-m";
import {useMotionPolicy} from "./use-motion-policy";
import {timing,standard} from "@/lib/motion";
export function Accordion({items}:{items:string[][]}){const[open,setOpen]=useState<number|null>(null);const id=useId();const{reduced}=useMotionPolicy();return <LayoutGroup id={id}><div>{items.map(([q,a],index)=><m.div layout={!reduced} className="faq-item" key={q}><button className="faq-trigger" aria-expanded={open===index} aria-controls={`${id}-${index}`} id={`${id}-trigger-${index}`} onClick={()=>setOpen(open===index?null:index)}>{q}<m.span aria-hidden animate={{rotate:open===index?45:0}} transition={{duration:timing.micro}}>+</m.span></button><AnimatePresence initial={false}>{open===index&&<m.div key="answer" id={`${id}-${index}`} role="region" aria-labelledby={`${id}-trigger-${index}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,transition:{duration:.1}}} transition={standard}><m.p layout={reduced?false:"position"} initial={{y:reduced?0:5}} animate={{y:0}}>{a}</m.p></m.div>}</AnimatePresence></m.div>)}</div></LayoutGroup>}
