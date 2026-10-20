import {serializeJsonLd, websiteJsonLd, pageMetadata} from "@/lib/seo";
export const metadata = pageMetadata("Cars for Sale in Nigeria", "Discover cars for sale in Nigeria. Compare prices, condition reports and features, and find a shortlist matched to your budget and priorities.", "/");
import {redirect} from "next/navigation";
import Link from "next/link";
import {ScrollProgress} from "@/components/motion/scroll-progress";
import {listActiveVehicles,inventoryStats} from "@/lib/vehicles";
import {getCurrentUser} from "@/lib/auth";
import {Hero} from "@/components/home/hero";
import {MarketplaceJourneys} from "@/components/home/marketplace-journeys";
import {FeaturedCars} from "@/components/home/featured-cars";
import {DecisionIntro,DecisionCriteria,DecisionProcess,Benefits} from "@/components/home/decision-sections";
import {DecisionPreview} from "@/components/home/decision-preview";
import {ComparisonShowcase,InventorySection,FAQ,FinalCTA} from "@/components/home/closing-sections";
export const dynamic="force-dynamic";
export default async function Home(){
  const user=await getCurrentUser();
  if(user?.role==="ADMIN")redirect("/admin");
  const [vehicles,stats]=await Promise.all([listActiveVehicles({},12),inventoryStats()]);
  const hero=vehicles.find(vehicle=>vehicle.make==="Mercedes-Benz")??vehicles[0];
  return <div className="editorial-home"><script type="application/ld+json" dangerouslySetInnerHTML={{__html: serializeJsonLd(websiteJsonLd)}}/><ScrollProgress/><Hero vehicle={hero}/><section className="container pt-8"><div className="card flex flex-wrap items-center justify-between gap-5 p-6"><div><p className="eyebrow">CAR RENTALS</p><h2 className="mt-2 text-2xl font-bold">Need a car for a short while?</h2><p className="mt-1 text-[#68756f]">Browse available rentals for your next trip.</p></div><Link className="btn btn-dark" href="/rentals">Rent a car</Link></div></section><MarketplaceJourneys/><DecisionIntro/><FeaturedCars vehicles={vehicles.slice(0,4)}/><DecisionCriteria/><DecisionProcess/><DecisionPreview vehicles={vehicles}/><ComparisonShowcase vehicles={vehicles}/><Benefits/><InventorySection {...stats}/><FAQ/><FinalCTA vehicle={vehicles[1]??vehicles[0]}/></div>;
}
