import type {CarPreference,Vehicle} from "@/types";
export interface AIProvider{generateStructuredObject<T>(input:{system:string;prompt:string;schemaName:string}):Promise<T>;generateText(input:{system:string;prompt:string}):Promise<string>}
export type AdviserRecommendation={vehicleId:string;vehicle:Vehicle;score:number;reasons:string[];tradeOffs:string[]};
export type AdviserResponse={preference:CarPreference;clarification?:string;recommendations?:AdviserRecommendation[];alternatives?:AdviserRecommendation[];noMatch?:{constraint:string;count:number}[]};
