"use client";
import {createContext,createElement,useContext,useMemo,useSyncExternalStore,type ReactNode} from "react";
import {useReducedMotion} from "motion/react";
const query="(min-width: 901px) and (hover: hover) and (pointer: fine)";
function subscribe(callback:()=>void){const media=window.matchMedia(query);media.addEventListener("change",callback);return()=>media.removeEventListener("change",callback)}
const Policy=createContext({reduced:false,desktop:false,depth:false});
export function MotionPolicyProvider({children}:{children:ReactNode}){const desktop=useSyncExternalStore(subscribe,()=>window.matchMedia(query).matches,()=>false);const reduced=!!useReducedMotion();const value=useMemo(()=>({reduced,desktop,depth:desktop&&!reduced}),[desktop,reduced]);return createElement(Policy.Provider,{value},children)}
export function useMotionPolicy(){return useContext(Policy)}
