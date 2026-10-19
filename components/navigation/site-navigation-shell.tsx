"use client";

import {createContext, useCallback, useContext, useEffect, useRef, useState} from "react";
import {usePathname} from "next/navigation";
import * as m from "motion/react-m";
import {premiumEase} from "@/lib/motion";
import {useMotionPolicy} from "@/components/motion/use-motion-policy";
import {MobileMenu} from "./mobile-menu";

type User={name:string;email:string};
type NavigationContext={open:boolean;toggle:()=>void;close:(restoreFocus?:boolean)=>void;triggerRef:React.RefObject<HTMLButtonElement|null>};
const Navigation=createContext<NavigationContext|null>(null);
export function useMobileNavigation(){const navigation=useContext(Navigation);if(!navigation)throw new Error("useMobileNavigation must be used inside SiteNavigationShell");return navigation}
export function SiteNavigationShell({children,initialUser,accountHref}:{children:React.ReactNode;initialUser?:User;accountHref:string}){
 const[open,setOpen]=useState(false);const triggerRef=useRef<HTMLButtonElement>(null);const pathname=usePathname();const{reduced}=useMotionPolicy();const close=useCallback((restoreFocus=false)=>{setOpen(false);if(restoreFocus)requestAnimationFrame(()=>triggerRef.current?.focus())},[]);const toggle=useCallback(()=>setOpen(value=>!value),[]);
 useEffect(()=>{close()},[pathname,close]);useEffect(()=>{const media=window.matchMedia("(min-width: 901px)");const reset=()=>{if(media.matches)setOpen(false)};media.addEventListener("change",reset);return()=>media.removeEventListener("change",reset)},[]);useEffect(()=>{if(!open)return;const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();close(true)}};window.addEventListener("keydown",onKeyDown);return()=>window.removeEventListener("keydown",onKeyDown)},[open,close]);useEffect(()=>{if(!open)return;const y=window.scrollY,body=document.body,previous={position:body.style.position,top:body.style.top,width:body.style.width,overflow:body.style.overflow};body.style.position="fixed";body.style.top=`-${y}px`;body.style.width="100%";body.style.overflow="hidden";return()=>{body.style.position=previous.position;body.style.top=previous.top;body.style.width=previous.width;body.style.overflow=previous.overflow;window.scrollTo(0,y)}},[open]);
 return <Navigation.Provider value={{open,toggle,close,triggerRef}}><div className="site-navigation-shell" data-navigation-open={open||undefined}><MobileMenu initialUser={initialUser} accountHref={accountHref}/><m.div className="site-page-layer" initial={false} animate={open?{x:"var(--mobile-menu-width)",scale:reduced?1:.985,borderRadius:reduced?0:24}:{x:0,scale:1,borderRadius:0}} transition={{duration:reduced?0:.58,ease:premiumEase}} style={{willChange:open?"transform,border-radius":"auto"}}>{children}{open&&<button type="button" className="site-dismiss-shield" aria-label="Close navigation" onClick={()=>close(true)}/>}</m.div></div></Navigation.Provider>;
}
