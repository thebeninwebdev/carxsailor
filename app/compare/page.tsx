import {listActiveVehicles} from "@/lib/vehicles";
import {Comparison} from "@/components/cars/comparison";
export const metadata={title:"Compare cars"};
export default async function Page({searchParams}:{searchParams:Promise<{cars?:string}>}){const[q,vehicles]=await Promise.all([searchParams,listActiveVehicles({},1000)]);const ids=typeof q.cars==="string"?[...new Set(q.cars.split(","))].slice(0,3):[];return <div className="container py-14"><p className="eyebrow">Discover / Decide / Compare</p><h1 className="display mt-4 text-5xl sm:text-6xl">Compare what matters.</h1><p className="mt-5 max-w-xl leading-8 text-[#69756f]">Put your finalists side by side. A better fit starts with understanding where they differ.</p><Comparison vehicles={vehicles} initialIds={ids}/></div>}
