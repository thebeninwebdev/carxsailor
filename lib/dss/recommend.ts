import "server-only";
import {listActiveVehicles} from "@/lib/vehicles";
import {analyzeNoMatch,hardConstraintReasons,rankVehicles} from "./engine";
import type {CarPreference} from "@/types";
import type {AdviserResponse} from "@/lib/ai/types";
export async function recommend(preference:CarPreference):Promise<AdviserResponse>{const vehicles=await listActiveVehicles({},1000);const result=rankVehicles(vehicles,preference);const response=(x:typeof result.ranked[number])=>({vehicleId:x.vehicle.id,vehicle:x.vehicle,score:x.score,reasons:x.reasons,tradeOffs:x.tradeOffs});if(result.ranked.length)return {preference,recommendations:result.ranked.slice(0,3).map(response)};const relaxed=rankVehicles(vehicles,{...preference,budget:undefined});const alternatives=relaxed.ranked.slice().sort((a,b)=>a.vehicle.price-b.vehicle.price).slice(0,3).map(x=>({...response(x),tradeOffs:[...hardConstraintReasons(x.vehicle,preference),...x.tradeOffs]}));return {preference,recommendations:[],noMatch:analyzeNoMatch(vehicles,preference),alternatives}}
