import {saveDecision} from "@/lib/buyer-mutations";
import {jsonMutation} from "@/lib/json-mutation";
export async function POST(request:Request){return jsonMutation(request,input=>saveDecision(input&&typeof input==="object"&&"preference" in input?input.preference:undefined));}
