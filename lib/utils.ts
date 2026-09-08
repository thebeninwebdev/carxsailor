import {clsx,type ClassValue} from "clsx";
export const cn=(...v:ClassValue[])=>clsx(v);
export const money=(value:number)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(value).replace("NGN","\u20a6");
export const compactNumber=(value:number)=>new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:1}).format(value);
