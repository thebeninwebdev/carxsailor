/** Parse the guided field where an un-suffixed small number means millions. */
export function parseNairaBudget(input:string):number|null {
 const normalized=input.trim().toLowerCase().replaceAll(",","").replaceAll("\u20A6","").replace(/^ngn\s*/,"").trim(),match=normalized.match(/^(\d+(?:\.\d+)?)\s*(m|million|millions|k|thousand)?$/);
 if(!match)return null;const amount=Number(match[1]);if(!Number.isFinite(amount)||amount<=0)return null;const suffix=match[2],multiplier=suffix==="k"||suffix==="thousand"?1_000:suffix||amount<1_000?1_000_000:1,naira=Math.round(amount*multiplier);
 return Number.isSafeInteger(naira)&&naira>=100_000&&naira<=1_000_000_000?naira:null;
}
export function parseNairaAmount(input:string):number|null {
 const normalized=input.trim().toLowerCase().replaceAll(",","").replaceAll("\u20A6","").replace(/^ngn\s*/,"").trim(),match=normalized.match(/^(\d+(?:\.\d+)?)\s*(m|million|millions|k|thousand)?$/);if(!match)return null;
 const amount=Number(match[1]),multiplier=match[2]==="m"||match[2]?.startsWith("million")?1_000_000:match[2]==="k"||match[2]==="thousand"?1_000:1,naira=Math.round(amount*multiplier);return Number.isSafeInteger(naira)&&naira>=0?naira:null;
}
export const formatNaira=(value:number)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(value).replace("NGN","\u20A6");
export const formatCompactNaira=(value:number)=>"\u20A6"+new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:1}).format(value).toLowerCase();
