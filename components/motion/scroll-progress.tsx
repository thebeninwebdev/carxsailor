"use client";
import {useScroll} from "motion/react";
import * as m from "motion/react-m";
export function ScrollProgress(){const{scrollYProgress}=useScroll();return <m.div aria-hidden className="reading-progress" style={{scaleX:scrollYProgress}}/>}
