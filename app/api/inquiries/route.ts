import {sendInquiry} from "@/lib/buyer-mutations";
import {jsonMutation} from "@/lib/json-mutation";
export async function POST(request:Request){return jsonMutation(request,sendInquiry);}
