"use client";
import {useRef} from "react";
import {useScroll,useTransform,type MotionValue} from "motion/react";
import * as m from "motion/react-m";
import {useMotionPolicy} from "./use-motion-policy";
function Word({word,index,count,progress,reduced}:{word:string;index:number;count:number;progress:MotionValue<number>;reduced:boolean}){const opacity=useTransform(progress,[index/count,(index+1)/count],[.4,1]);return <m.span aria-hidden style={{opacity:reduced?1:opacity}}>{word} </m.span>}
export function WordHighlight({text}:{text:string}){const ref=useRef<HTMLHeadingElement>(null);const{reduced}=useMotionPolicy();const{scrollYProgress}=useScroll({target:ref,offset:["start .9","end .45"]});const words=text.split(" ");return <h2 ref={ref} aria-label={text}>{words.map((word,index)=><Word key={index} {...{word,index,reduced}} count={words.length} progress={scrollYProgress}/>)}</h2>}
