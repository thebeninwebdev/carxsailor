import {afterEach, describe, expect, it, vi} from "vitest";
import {pageMetadata, serializeJsonLd, vehicleMetadata, vehicleJsonLd} from "./seo";
import type {Vehicle} from "@/types";

const vehicle = {title: "2020 Toyota Corolla", year: 2020, make: "Toyota", model: "Corolla", slug: "toyota-corolla", description: "A listed car.", price: 12000000, location: {city: "Lagos"}, mileage: 35000, transmission: "AUTOMATIC", fuelType: "PETROL", images: [], origin: "FOREIGN_USED"} as unknown as Vehicle;
afterEach(() => {vi.unstubAllEnvs(); vi.resetModules();});
describe("public SEO identity", () => {
  it("keeps each public page canonical and aligns both social cards", () => {
    const metadata = pageMetadata("Compare cars", "Compare available cars", "/compare");
    expect(metadata.title).toEqual({absolute: "Compare cars | CarXSailor"});
    expect(String(metadata.alternates?.canonical)).toMatch(/\/compare$/);
    expect(metadata.openGraph).toMatchObject({title: "Compare cars | CarXSailor", url: metadata.alternates?.canonical});
    expect(metadata.twitter).toMatchObject({card: "summary_large_image", title: "Compare cars | CarXSailor"});
  });
  it("marks demo listings noindex and supplies fallback sharing artwork", () => {
    const metadata = vehicleMetadata({...vehicle, isDemo: true});
    expect(metadata.robots).toMatchObject({index: false});
    expect(metadata.openGraph).toMatchObject({images: [expect.objectContaining({url: expect.stringContaining("/social-preview.png")})]});
  });
  it("escapes seller content without changing the structured data", () => {
    const content = {description: '</script><script>alert("seller")</script>'};
    const serialized = serializeJsonLd(content);
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(content);
  });
  it("uses actual listing price and condition without invented reviews", () => {
    const data = vehicleJsonLd(vehicle);
    expect(data.offers).toMatchObject({price: 12000000, priceCurrency: "NGN", itemCondition: "https://schema.org/UsedCondition"});
    expect(data).not.toHaveProperty("aggregateRating");
    expect(vehicleJsonLd({...vehicle, origin: undefined}).offers).not.toHaveProperty("itemCondition");
  });
  it("disables indexing on Vercel preview deployments", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.resetModules();
    const preview = await import("./seo");
    expect(preview.pageMetadata("Preview", "Preview page", "/").robots).toMatchObject({index: false});
  });
});
