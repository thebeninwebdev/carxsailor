import {Suspense} from "react";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {MutationNotice} from "@/components/forms/notice";
import {BackToTop} from "@/components/navigation/back-to-top";
import {MotionProvider} from "@/components/motion/provider";
import type {Metadata, Viewport} from "next";
import {siteUrl, siteName, siteDescription, indexingEnabled} from "@/lib/seo";
import {getSessionUser} from "@/lib/auth";
import {isAdminWorkspacePath} from "@/lib/safe-next";
import {connectMongoose} from "@/lib/db";
import {VendorProfileModel} from "@/models/VendorProfile";
import {Navbar} from "@/components/navigation/navbar";
import {Footer} from "@/components/navigation/footer";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {default: "Cars for Sale in Nigeria | CarXSailor", template: "%s | CarXSailor"},
  description: siteDescription,
  robots: {index: indexingEnabled, follow: true},
  openGraph: {type: "website", locale: "en_NG", siteName, title: "Cars for Sale in Nigeria | CarXSailor", description: siteDescription, images: [{url: "/social-preview.png", width: 1200, height: 630, alt: "CarXSailor - Find the car that fits your life"}]},
  twitter: {card: "summary_large_image", title: "Cars for Sale in Nigeria | CarXSailor", description: siteDescription, images: ["/social-preview.png"]},
  verification: {google: process.env.GOOGLE_SITE_VERIFICATION || undefined},
};
export const viewport: Viewport = {themeColor: "#163f31", width: "device-width", initialScale: 1};
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