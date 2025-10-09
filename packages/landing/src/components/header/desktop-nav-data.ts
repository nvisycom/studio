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
	Megaphone,
	Scale,
	Plug,
	Map as MapIcon,
	Star,
	HelpCircle,
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
			isExternal: true,
		},
		{
			title: "Nvisy CLI",
			href: "https://nvisy.com/cli",
			description: "Command-line redaction tool",
			icon: Terminal,
			isExternal: true,
		},
	],
	features: [
		{
			title: "Features",
			href: "/features",
			description: "Explore our powerful features",
			icon: Star,
		},
	],
	customers: [
		{
			title: "TechCorp: 95% Processing Time Reduction",
			href: "/customers/techcorp-data-protection",
			excerpt:
				"How a Fortune 500 financial firm automated compliance workflows",
		},
		{
			title: "HealthPlus: 100% HIPAA Compliance",
			href: "/customers/healthplus-hipaa-compliance",
			excerpt: "Protecting 50M+ patient records with on-premise deployment",
		},
	],
	comparisons: [
		{
			title: "Nvisy Cloud vs Adobe Redaction",
			href: "/comparisons/adobe",
			description: "Compare with Adobe's document services",
			icon: Code,
		},
	],
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
			icon: HelpCircle,
		},
		{
			title: "Legal",
			href: "/legal",
			description: "Policies & legal documents",
			icon: Scale,
		},
		{
			title: "Newsroom",
			href: "/newsroom",
			description: "News & press releases",
			icon: Megaphone,
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
