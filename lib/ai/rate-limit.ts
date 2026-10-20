import "server-only";
const requests=new Map<string,{count:number;reset:number}>();
export function allowVehicleAssistantRequest(key:string,limit=12,windowMs=60000){const now=Date.now(),current=requests.get(key);if(!current||current.reset<=now){requests.set(key,{count:1,reset:now+windowMs});return true}if(current.count>=limit)return false;current.count++;return true}
