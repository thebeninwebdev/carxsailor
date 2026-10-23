import {toNextJsHandler} from "better-auth/next-js";
import {auth} from "@/lib/auth";
import {connectMongoClient} from "@/lib/db";
const handlers=toNextJsHandler(async(request:Request)=>{await connectMongoClient();return auth.handler(request);});
async function handle(method:"GET"|"POST",request:Request){const url=new URL(request.url);const isGoogleCallback=url.pathname.endsWith("/callback/google");if(process.env.NODE_ENV!=="production"&&isGoogleCallback)console.info("[Google OAuth callback] host:",url.host);const response=await handlers[method](request);if(process.env.NODE_ENV!=="production"&&isGoogleCallback)console.info("[Google OAuth callback] completed:",response.status);return response;}
export const GET=(request:Request)=>handle("GET",request);
export const POST=(request:Request)=>handle("POST",request);
