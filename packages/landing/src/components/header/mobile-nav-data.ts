import type {
	ProductSection,
	ResourceSection,
	SolutionSection,
} from "./nav-types";
import {
	BookOpen,
	Braces,
	Building,
	Building2,
	Cloud,
	Code,
	HeartPulse,
	Info,
	Landmark,
	Mail,
	Map as MapIcon,
	Package,
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
			title: "Nvisy Desktop",
			href: "/products/desktop",
			description: "Cross-platform redaction UI",
			icon: Terminal,
		},
	],
	opensource: [
		{
			title: "Nvisy Runtime",
			href: "https://github.com/nvisycom/run",
			description: "Secure OCR runtime with redaction",
			icon: Package,
			isExternal: true,
		},
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
			title: "Reference",
			href: "https://docs.nvisy.com/api-reference",
			description: "Complete API documentation",
			icon: Code,
			isExternal: true,
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
			title: "Careers",
			href: "/careers",
			description: "Join our remote team",
			icon: Building2,
		},
	],
	support: [
		{
			title: "Docs",
			href: "https://docs.nvisy.com",
			description: "Guides & API docs",
			icon: BookOpen,
			isExternal: true,
		},
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
	blog: [
		{
			title: "Blog Post 02",
			href: "/blog/lorem-ipsum-02",
			excerpt:
				"Exploring the fundamentals of modern web development and industry best practices.",
		},
		{
			title: "Blog Post 03",
			href: "/blog/lorem-ipsum-03",
			excerpt:
				"An in-depth look at content creation and publishing in the digital age.",
		},
		{
			title: "Blog Post 01",
			href: "/blog/lorem-ipsum-01",
			excerpt:
				"A comprehensive guide exploring modern development practices with TypeScript and Rust examples.",
		},
	],
};
