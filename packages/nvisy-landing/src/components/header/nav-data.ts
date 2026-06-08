import type { NavigationMenuColumns } from "./nav-types";

// Product mega-menu: 3 columns (2 / 2 / 2 items).
export const products: NavigationMenuColumns = [
	{
		items: [
			{
				title: "Features",
				href: "/features",
				description: "Redact sensitive data across docs, images, and audio.",
			},
			{
				title: "Runtime",
				href: "/runtime",
				description: "Run the redaction engine in your own infrastructure.",
			},
		],
	},
	{
		items: [
			{
				title: "SDKs",
				href: "/sdks",
				description: "Native client libraries for every major language.",
			},
			{
				title: "Integrations",
				href: "/integrations",
				description: "Connect Nvisy to the tools your team already uses.",
			},
		],
	},
	{
		items: [
			{
				title: "Docs",
				href: "https://docs.nvisy.com",
				description: "Guides and references to build with Nvisy.",
				isExternal: true,
			},
			{
				title: "Security",
				href: "/security",
				description: "Encryption, zero data retention, and compliance.",
			},
		],
	},
];

// Resources mega-menu: 3 columns (2 / 1 / 1 items).
export const resources: NavigationMenuColumns = [
	{
		items: [
			{
				title: "Changelog",
				href: "/changelog",
				description: "The latest features, improvements, and fixes.",
			},
			{
				title: "Blog",
				href: "/blog",
				description: "Product news and engineering deep-dives.",
			},
		],
	},
	{
		items: [
			{
				title: "About",
				href: "/about",
				description: "Who we are and why we built Nvisy.",
			},
		],
	},
	{
		items: [
			{
				title: "Legal",
				href: "/legal",
				description: "Terms, privacy, and data processing.",
			},
		],
	},
];
