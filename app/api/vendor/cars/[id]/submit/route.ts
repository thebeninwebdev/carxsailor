import {mutationRoute} from "@/lib/mutation-route";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return mutationRoute(request,"submitListing",(await params).id);}
