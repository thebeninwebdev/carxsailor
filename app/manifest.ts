import type {MetadataRoute} from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CarXSailor",
    short_name: "CarXSailor",
    description: "Discover and compare cars in Nigeria.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fafaf7",
    theme_color: "#163f31",
    lang: "en-NG",
    icons: [
      {src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any"},
      {src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any"},
    ],
  };
}
