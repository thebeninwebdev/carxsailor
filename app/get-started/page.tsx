import {redirect} from "next/navigation";
import {getCurrentUser,getPostLoginDestination} from "@/lib/auth";

export const metadata={title:"Get started",robots:{index:false,follow:false}};

export default async function Page(){
  const user=await getCurrentUser();
  if(user)redirect(await getPostLoginDestination(user));
  redirect("/car-adviser");
}