import type { ProductSection } from "./nav-types";
import { Braces, Puzzle, Server, Terminal } from "lucide-vue-next";

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
