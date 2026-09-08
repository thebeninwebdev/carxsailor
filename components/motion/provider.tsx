"use client";
import {LazyMotion,MotionConfig} from "motion/react";
import {standard} from "@/lib/motion";
import {MotionPolicyProvider} from "./use-motion-policy";
const features=()=>import("./features").then(module=>module.default);
export function MotionProvider({children}:{children:React.ReactNode}){return <MotionConfig reducedMotion="user" transition={standard}><MotionPolicyProvider><LazyMotion features={features} strict>{children}</LazyMotion></MotionPolicyProvider></MotionConfig>}
