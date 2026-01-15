import type {
	ProductSection,
	ResourceSection,
	SolutionSection,
} from "./nav-types";
import {
	BookOpen,
	Braces,
	Code,
	FileText,
	History,
	Puzzle,
	Scale,
	Server,
	Terminal,
	Users,
} from "lucide-vue-next";

export const products: ProductSection = {
	platforms: [
		{
			title: "Nvisy Server",
			href: "/products/server",
			description: "Cloud & on-premise deployment",
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
	byUsecase: [],
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
			description: "Connect your tools",
			icon: Puzzle,
		},
		{
			title: "Changelog",
			href: "/changelog",
			description: "Latest updates & releases",
			icon: History,
		},
	],
	support: [
		{
			title: "About",
			href: "/about",
			description: "Learn more about Nvisy",
			icon: Users,
		},
		{
			title: "Blog",
			href: "/blog",
			description: "News & updates",
			icon: FileText,
		},
		{
			title: "Legal",
			href: "/legal",
			description: "Policies & legal documents",
			icon: Scale,
		},
	],
};
