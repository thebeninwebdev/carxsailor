import type {CarPreference,Vehicle} from "@/types";
import type {RecommendationScore} from "@/lib/dss/engine";
export interface AIProvider{generateStructuredObject<T>(input:{system:string;prompt:string;schemaName:string}):Promise<T>;generateText(input:{system:string;prompt:string}):Promise<string>}
export type AdviserRecommendation={vehicleId:string;vehicle:Vehicle;score:number;reasons:string[];tradeOffs:string[];unknowns:string[];debug?:Pick<RecommendationScore,"rawScore"|"maximumScore"|"breakdown">};
export type AdviserResponse={preference:CarPreference;inventoryCount?:number;clarification?:string;recommendations?:AdviserRecommendation[]};
