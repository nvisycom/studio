import type { ProductSection } from "./nav-types";
import { Braces, Code, Server, Terminal } from "lucide-vue-next";

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
