import type { FooterSection } from "./nav-types";

export const footerSections: FooterSection[] = [
	{
		title: "Product",
		links: [
			{ name: "Nvisy Cloud", href: "/products/cloud" },
			{ name: "Nvisy Server", href: "/products/local" },
			{
				name: "Documentation",
				href: "https://docs.nvisy.com",
				isExternal: true,
			},
			{
				name: "API Reference",
				href: "https://docs.nvisy.com/api",
				isExternal: true,
			},
			{ name: "Integrations", href: "/integrations" },
		],
	},
	{
		title: "Solutions",
		links: [
			{ name: "Healthcare", href: "/solutions/healthcare" },
			{ name: "Financial", href: "/solutions/financial" },
			{ name: "Government", href: "/solutions/government" },
			{ name: "Insurance", href: "/solutions/insurance" },
		],
	},
	{
		title: "Company",
		links: [
			{ name: "About", href: "/about" },
			{ name: "Blog", href: "/blog" },
			{ name: "Careers", href: "/careers" },
			{ name: "Contact", href: "/contact" },
		],
	},
	{
		title: "Legal",
		links: [
			{ name: "Privacy Policy", href: "/legal/privacy-policy" },
			{ name: "Terms of Service", href: "/legal/terms-of-service" },
			{ name: "Acceptable Use", href: "/legal/acceptable-use" },
			{ name: "Cookie Policy", href: "/legal/cookie-policy" },
			{ name: "Subprocessors", href: "/legal/subprocessors" },
		],
	},
];
