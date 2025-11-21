import type {
  ProductSection,
  SolutionSection,
  ResourceSection,
} from "./nav-types";
import {
  Server,
  Cloud,
  Code,
  Terminal,
  Building2,
  Landmark,
  HeartPulse,
  ShieldCheck,
  Building,
  Rocket,
  BookOpen,
  HelpCircle,
  Plug,
  MapIcon,
} from "lucide-vue-next";

export const products: ProductSection = {
  platforms: [
    {
      title: "Nvisy Local",
      href: "/products/local",
      description: "On-premise security & control",
      icon: Server,
    },
    {
      title: "Nvisy Cloud",
      href: "/products/cloud",
      description: "Scalable cloud deployment",
      icon: Cloud,
    },
  ],
  opensource: [
    {
      title: "Nvisy Runtime",
      href: "https://github.com/nvisycom/run",
      description: "Secure OCR runtime with redaction",
      icon: Code,
    },
    {
      title: "Nvisy CLI",
      href: "https://nvisy.com/cli",
      description: "Command-line redaction tool",
      icon: Terminal,
    },
  ],
  features: [],
  customers: [],
  comparisons: [],
};

export const solutions: SolutionSection = {
  integrations: [],
  usecase: [
    {
      title: "Financial",
      href: "/solutions/financial",
      icon: Building2,
    },
    {
      title: "Government",
      href: "/solutions/government",
      icon: Landmark,
    },
    {
      title: "Healthcare",
      href: "/solutions/healthcare",
      icon: HeartPulse,
    },
    {
      title: "Insurance",
      href: "/solutions/insurance",
      icon: ShieldCheck,
    },
  ],
  stage: [
    {
      title: "Enterprise",
      href: "/solutions/enterprise",
      icon: Building,
    },
    {
      title: "Startups",
      href: "/solutions/startup",
      icon: Rocket,
    },
  ],
};

export const resources: ResourceSection = {
  developers: [
    {
      title: "Documentation",
      href: "https://docs.nvisy.com",
      description: "Guides & tutorials",
      icon: BookOpen,
      isExternal: true,
    },
    {
      title: "API Reference",
      href: "https://docs.nvisy.com/api",
      description: "API documentation",
      icon: Code,
    },
    {
      title: "Integrations",
      href: "/integrations",
      description: "Connect & integrate with APIs",
      icon: Plug,
    },
    {
      title: "Roadmap",
      href: "/roadmap",
      description: "Product development roadmap",
      icon: MapIcon,
    },
    {
      title: "Customers",
      href: "/customers",
      description: "Customer success stories",
      icon: Building,
    },
  ],
  support: [
    {
      title: "Contact",
      href: "/contact",
      description: "Get in touch with our team",
      icon: HelpCircle,
    },
    {
      title: "Blog",
      href: "/blog",
      description: "Latest articles & updates",
      icon: BookOpen,
    },
  ],
  blog: [],
};
