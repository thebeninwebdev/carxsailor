import {Suspense} from "react";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {MutationNotice} from "@/components/forms/notice";
import {BackToTop} from "@/components/navigation/back-to-top";
import {MotionProvider} from "@/components/motion/provider";
import type {Metadata} from "next";
import {getSessionUser} from "@/lib/auth";
import {isAdminWorkspacePath} from "@/lib/safe-next";
import {connectMongoose} from "@/lib/db";
import {VendorProfileModel} from "@/models/VendorProfile";
import {Navbar} from "@/components/navigation/navbar";
import {Footer} from "@/components/navigation/footer";
import "./globals.css";
export const metadata:Metadata={title:{default:"CarXSailor - Find the car that fits your life",template:"%s | CarXSailor"},description:"Discover, evaluate and compare available cars in Nigeria. Get guidance based on your budget and priorities.",metadataBase:new URL(process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000")};
export default async function RootLayout({children}:{children:React.ReactNode}){
  const [user,requestHeaders]=await Promise.all([getSessionUser(),headers()]);
  const path=requestHeaders.get("x-carxsailor-path")||"/";
  if(user&&!user.emailVerified&&!path.startsWith("/verify-email"))redirect("/verify-email?email="+encodeURIComponent(user.email));
  const verifiedUser=user?.emailVerified?user:undefined;
  if(verifiedUser?.role==="ADMIN"){
    if(!isAdminWorkspacePath(path))redirect("/admin");
    return <html lang="en" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main-content">Skip to content</a><main id="main-content" tabIndex={-1}><Suspense><MutationNotice/></Suspense>{children}</main></body></html>;
  }
  let seller=false;
  if(verifiedUser){await connectMongoose();seller=!!await VendorProfileModel.exists({userId:verifiedUser.id});}
  return <html lang="en" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main-content">Skip to content</a><MotionProvider><Navbar initialUser={verifiedUser?{name:verifiedUser.name,email:verifiedUser.email}:undefined} accountHref={seller?"/vendor":"/dashboard"}/><main id="main-content" tabIndex={-1}><Suspense><MutationNotice/></Suspense>{children}</main><Footer/><BackToTop/></MotionProvider></body></html>;
}