import {MotionProvider} from "@/components/motion/provider";
import type {Metadata} from "next";
import {getCurrentUser} from "@/lib/auth";
import {connectMongoose} from "@/lib/db";
import {VendorProfileModel} from "@/models/VendorProfile";
import {Navbar} from "@/components/navigation/navbar";
import {Footer} from "@/components/navigation/footer";
import "./globals.css";
export const metadata:Metadata={title:{default:"CarXSailor - Find the car that fits your life",template:"%s | CarXSailor"},description:"Discover, evaluate and compare available cars in Nigeria. Get guidance based on your budget and priorities.",metadataBase:new URL(process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000")};
export default async function RootLayout({children}:{children:React.ReactNode}){const user=await getCurrentUser();let seller=false;if(user){await connectMongoose();seller=!!await VendorProfileModel.exists({userId:user.id})}return <html lang="en" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main-content">Skip to content</a><MotionProvider><Navbar initialUser={user?{name:user.name,email:user.email}:undefined} accountHref={user?.role==="ADMIN"?"/admin":seller?"/vendor":"/dashboard"}/><main id="main-content">{children}</main><Footer/></MotionProvider></body></html>}
