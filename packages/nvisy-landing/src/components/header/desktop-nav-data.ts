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
	Landmark,
	Mail,
	Plug,
	Scale,
	Server,
	ShieldCheck,
	Terminal,
	Users,
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
};

export const solutions: SolutionSection = {
	byUsecase: [
		{
			title: "Financial",
			href: "/solutions/financial",
			description: "Banks & fintech",
			icon: Building2,
		},
		{
			title: "Government",
			href: "/solutions/government",
			description: "Public sector",
			icon: Landmark,
		},
		{
			title: "Healthcare",
			href: "/solutions/healthcare",
			description: "HIPAA compliant",
			icon: HeartPulse,
		},
		{
			title: "Insurance",
			href: "/solutions/insurance",
			description: "Claims & policies",
			icon: ShieldCheck,
		},
	],
	byCompany: [],
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
			icon: Users,
		},
		{
			title: "Legal",
			href: "/legal",
			description: "Policies & legal documents",
			icon: Scale,
		},
	],
};
