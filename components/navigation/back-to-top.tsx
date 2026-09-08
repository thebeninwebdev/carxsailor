"use client";

import {useSyncExternalStore} from "react";
import {AnimatePresence} from "motion/react";
import * as m from "motion/react-m";
import {ArrowUp} from "lucide-react";
import {useMotionPolicy} from "@/components/motion/use-motion-policy";
import {fastEase,timing} from "@/lib/motion";

function subscribe(callback:()=>void){
  window.addEventListener("scroll",callback,{passive:true});
  return ()=>window.removeEventListener("scroll",callback);
}
const snapshot=()=>window.scrollY>600;
const serverSnapshot=()=>false;

export function BackToTop(){
  const visible=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
  const {reduced}=useMotionPolicy();
  function goToTop(){
    document.getElementById("main-content")?.focus({preventScroll:true});
    const instant=reduced||window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({top:0,behavior:instant?"instant":"smooth"});
  }
  return <AnimatePresence initial={false}>{visible&&<m.button
    type="button"
    className="back-to-top"
    aria-label="Back to top"
    onClick={goToTop}
    initial={{opacity:0,y:reduced?0:16}}
    animate={{opacity:1,y:0}}
    exit={{opacity:0,y:reduced?0:8}}
    whileHover={reduced?undefined:{y:-3}}
    whileTap={reduced?undefined:{scale:.96}}
    transition={{duration:timing.micro,ease:fastEase}}
  ><ArrowUp size={20} aria-hidden/><span>Back to top</span></m.button>}</AnimatePresence>;
}
