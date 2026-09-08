"use client";
import * as m from "motion/react-m";
import {useMotionPolicy} from "./use-motion-policy";
import {timing,fastEase} from "@/lib/motion";
export function VehicleCardMotion({children}:{children:React.ReactNode}){const{depth,reduced}=useMotionPolicy();return <m.article className="card vehicle-motion-card overflow-hidden" initial={false} whileHover={depth?{y:-5}:undefined} whileTap={reduced?undefined:{scale:.995}} transition={{duration:timing.micro,ease:fastEase}}>{children}</m.article>}
