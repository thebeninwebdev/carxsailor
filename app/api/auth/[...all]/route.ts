import {toNextJsHandler} from "better-auth/next-js";
import {auth} from "@/lib/auth";
import {connectMongoClient} from "@/lib/db";

export const {GET,POST}=toNextJsHandler(async (request:Request)=>{
  await connectMongoClient();
  return auth.handler(request);
});
