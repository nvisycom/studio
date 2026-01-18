import type { ProductSection } from "./nav-types";
import { Braces, Puzzle, Server, Terminal } from "lucide-vue-next";

export const products: ProductSection = {
  platforms: [
    {
      title: "Features",
      href: "/features",
      description: "Explore platform capabilities",
      icon: Server,
    },
    {
      title: "Download",
      href: "/download",
      description: "Get the desktop app",
      icon: Terminal,
    },
  ],
  opensource: [
    {
      title: "SDKs",
      href: "/sdks",
      description: "Libraries for every language",
      icon: Braces,
    },
    {
      title: "Integrations",
      href: "/integrations",
      description: "Connect your tools",
      icon: Puzzle,
    },
  ],
};
