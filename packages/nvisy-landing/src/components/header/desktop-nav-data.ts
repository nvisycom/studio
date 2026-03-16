import type {
	ProductSection,
	ResourceSection,
	SolutionSection,
} from "./nav-types";
import {
	BookOpen,
	Braces,
	FileText,
	History,
	Puzzle,
	Server,
	Terminal,
	Users,
} from "lucide-vue-next";

export const products: ProductSection = {
	platforms: [
		{
			title: "Features",
			href: "/features",
			description: "Redaction capabilities & formats",
			icon: Server,
		},
		{
			title: "Runtime",
			href: "/runtime",
			description: "Self-hosted redaction engine",
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
	],
};
