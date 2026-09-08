"use client";
import {useEffect,useRef} from "react";
import {animate,useInView,useMotionValue,useTransform} from "motion/react";
import * as m from "motion/react-m";
import {premiumEase} from "@/lib/motion";
import {useMotionPolicy} from "./use-motion-policy";
export function AnimatedNumber({value}:{value:number}){const ref=useRef<HTMLElement>(null);const seen=useInView(ref,{once:true,amount:.8});const number=useMotionValue(value);const rounded=useTransform(number,n=>Math.round(n).toLocaleString("en-NG"));const played=useRef(false);const{reduced}=useMotionPolicy();useEffect(()=>{if(!seen||played.current||reduced)return;played.current=true;const controls=animate(number,[Math.max(0,value-Math.min(value,5)),value],{duration:.65,ease:premiumEase});return()=>controls.complete()},[seen,number,value,reduced]);return <strong ref={ref} className="tabular-nums"><span className="sr-only">{value}</span><m.span aria-hidden>{rounded}</m.span></strong>}
