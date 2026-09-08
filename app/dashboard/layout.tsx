import {requireUser} from "@/lib/auth";
export const metadata={robots:{index:false,follow:false}};
export default async function Layout({children}:{children:React.ReactNode}){await requireUser();return children}
