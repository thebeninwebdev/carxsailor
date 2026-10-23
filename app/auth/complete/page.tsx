import {redirect} from "next/navigation";
import {getPostLoginDestination,getSessionUser} from "@/lib/auth";
import {safeNext} from "@/lib/safe-next";
export default async function Page({searchParams}:{searchParams:Promise<{next?:string}>}){const[user,query]=await Promise.all([getSessionUser(),searchParams]);if(process.env.NODE_ENV!=="production")console.info("[Auth complete] user:",user?"present":"missing");if(!user)redirect("/login");if(!user.emailVerified)redirect("/verify-email?email="+encodeURIComponent(user.email));redirect(await getPostLoginDestination(user,safeNext(query.next,"")));}
