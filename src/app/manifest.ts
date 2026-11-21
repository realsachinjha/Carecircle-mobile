import type { MetadataRoute } from "next";
import { strings } from "@/strings/en";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: strings.appName,
    short_name: strings.appName,
    description: strings.landing.body,
    start_url: "/start",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b5cad",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
