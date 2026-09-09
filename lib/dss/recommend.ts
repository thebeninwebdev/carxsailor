import "server-only";
import {listRecommendationVehicles} from "@/lib/vehicles";
import {rankVehicles} from "./engine";
import type {CarPreference} from "@/types";
import type {AdviserResponse} from "@/lib/ai/types";
export async function recommend(preference:CarPreference):Promise<AdviserResponse>{const vehicles=await listRecommendationVehicles(),ranked=rankVehicles(vehicles,preference).ranked;return{preference,inventoryCount:vehicles.length,recommendations:ranked.map(item=>({vehicleId:item.vehicle.id,vehicle:item.vehicle,score:item.score,reasons:item.reasons,tradeOffs:item.tradeOffs,unknowns:item.unknowns,...(process.env.NODE_ENV!=="production"?{debug:{rawScore:item.rawScore,maximumScore:item.maximumScore,breakdown:item.breakdown}}:{})}))}}
