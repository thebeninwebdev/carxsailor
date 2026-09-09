import type {Metadata} from "next";
import type {Vehicle} from "@/types";

// Keep the public search identity independent of local auth/preview origins.
export const siteUrl = new URL(process.env.SITE_URL || "https://carxsailor.vercel.app").origin;
export const siteName = "CarXSailor";
export const siteDescription = "Discover cars for sale in Nigeria. Compare prices, condition reports and features, or find a shortlist matched to your budget and priorities with CarXSailor.";
export const indexingEnabled = process.env.VERCEL_ENV !== "preview";
export const absoluteUrl = (path: string) => new URL(path, siteUrl).toString();
const defaultImage = {url: absoluteUrl("/social-preview.png"), width: 1200, height: 630, alt: "CarXSailor - Find the car that fits your life"};

export function pageMetadata(title: string, description: string, path: string, options: {noIndex?: boolean; images?: {url: string; alt: string}[]} = {}): Metadata {
  const images = options.images?.length ? options.images : [defaultImage];
  const fullTitle = title + " | " + siteName;
  return {
    title: {absolute: fullTitle}, description,
    alternates: {canonical: absoluteUrl(path)},
    openGraph: {type: "website", locale: "en_NG", siteName, title: fullTitle, description, url: absoluteUrl(path), images},
    twitter: {card: "summary_large_image", title: fullTitle, description, images},
    robots: {index: indexingEnabled && !options.noIndex, follow: true, googleBot: {index: indexingEnabled && !options.noIndex, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1}},
  };
}

export function vehicleMetadata(vehicle: Vehicle): Metadata {
  const title = vehicle.year + " " + vehicle.make + " " + vehicle.model + " for Sale in " + vehicle.location.city;
  const description = (vehicle.description || siteDescription).replace(/\s+/g, " ").trim();
  return pageMetadata(title, description.length > 160 ? description.slice(0, 157).trimEnd() + "..." : description, "/cars/" + encodeURIComponent(vehicle.slug), {noIndex: vehicle.isDemo, images: vehicle.images.map(image => ({url: image.url, alt: image.alt || title}))});
}

// Escaping '<' prevents seller content from terminating an inline script.
export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
export const websiteJsonLd = {
  "@context": "https://schema.org", "@graph": [
    {"@type": "Organization", "@id": absoluteUrl("/#organization"), name: siteName, url: siteUrl, logo: absoluteUrl("/icon-512.png")},
    {"@type": "WebSite", "@id": absoluteUrl("/#website"), name: siteName, url: siteUrl, description: siteDescription, inLanguage: "en-NG", publisher: {"@id": absoluteUrl("/#organization")}},
  ],
};
export function vehicleJsonLd(vehicle: Vehicle) {
  return {"@context": "https://schema.org", "@type": "Car", name: vehicle.title, description: vehicle.description,
    url: absoluteUrl("/cars/" + encodeURIComponent(vehicle.slug)), image: vehicle.images.map(image => image.url),
    brand: {"@type": "Brand", name: vehicle.make}, model: vehicle.model, vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: {"@type": "QuantitativeValue", value: vehicle.mileage, unitCode: "KMT"},
    vehicleTransmission: vehicle.transmission, fuelType: vehicle.fuelType,
    offers: {"@type": "Offer", price: vehicle.price, priceCurrency: "NGN", availability: "https://schema.org/InStock",
      url: absoluteUrl("/cars/" + encodeURIComponent(vehicle.slug)),
      ...(vehicle.origin ? {itemCondition: vehicle.origin === "BRAND_NEW" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition"} : {})},
  };
}
