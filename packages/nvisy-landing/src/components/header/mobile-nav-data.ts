import type {
	ProductSection,
	ResourceSection,
	SolutionSection,
} from "./nav-types";
import {
	BookOpen,
	Braces,
	Building2,
	Cloud,
	Code,
	HeartPulse,
	Info,
	Landmark,
	Mail,
	Plug,
	Rocket,
	Scale,
	Server,
	ShieldCheck,
	Terminal,
} from "lucide-vue-next";

export const products: ProductSection = {
	platforms: [
		{
			title: "Nvisy Cloud",
			href: "/products/cloud",
			description: "Scalable cloud deployment",
			icon: Cloud,
		},
		{
			title: "Nvisy Server",
			href: "/products/server",
			description: "On-premise security & control",
			icon: Server,
		},
		{
			title: "Nvisy Studio",
			href: "/products/studio",
			description: "Cross-platform desktop app",
			icon: Terminal,
		},
	],
	opensource: [
		{
			title: "TypeScript SDK",
			href: "https://github.com/nvisycom/sdk-ts",
			description: "Modern JavaScript/TypeScript SDK",
			icon: Braces,
			isExternal: true,
		},
		{
			title: "Python SDK",
			href: "https://github.com/nvisycom/sdk-py",
			description: "Native Python library",
			icon: Code,
			isExternal: true,
		},
	],
	features: [],
	customers: [],
	comparisons: [],
};

export const solutions: SolutionSection = {
	integrations: [
		{
			title: "Slack",
			href: "/integrations",
			icon: Plug,
		},
		{
			title: "Google Drive",
			href: "/integrations",
			icon: Cloud,
		},
		{
			title: "Dropbox",
			href: "/integrations",
			icon: Cloud,
		},
		{
			title: "Notion",
			href: "/integrations",
			icon: BookOpen,
		},
		{
			title: "Zapier",
			href: "/integrations",
			icon: Plug,
		},
		{
			title: "Make",
			href: "/integrations",
			icon: Rocket,
		},
	],
	byUsecase: [
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
};

export const resources: ResourceSection = {
	developers: [
		{
			title: "Docs",
			href: "https://docs.nvisy.com",
			description: "Guides & API docs",
			icon: BookOpen,
			isExternal: true,
		},
		{
			title: "Integrations",
			href: "/integrations",
			description: "Connect & integrate with APIs",
			icon: Plug,
		},
	],
	support: [
		{
			title: "Contact",
			href: "/contact",
			description: "Get in touch with our team",
			icon: Mail,
		},
		{
			title: "About",
			href: "/about",
			description: "Learn more about Nvisy",
			icon: Info,
		},
		{
			title: "Legal",
			href: "/legal",
			description: "Policies & legal documents",
			icon: Scale,
		},
	],
};
