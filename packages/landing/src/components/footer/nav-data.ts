import type { FooterSection } from "./nav-types";

export const footerSections: FooterSection[] = [
	{
		title: "Product",
		links: [
			{ name: "Features", href: "/features" },
			{ name: "Pricing", href: "/pricing" },
			{ name: "Integrations", href: "/integrations" },
			{ name: "Roadmap", href: "/roadmap" },
			{ name: "Customers", href: "/customers" },
		],
	},
	{
		title: "Support",
		links: [
			{
				name: "Documentation",
				href: "https://docs.nvisy.com",
				isExternal: true,
			},
			{
				name: "API Reference",
				href: "https://docs.nvisy.com",
				isExternal: true,
			},
			{ name: "Contact", href: "/contact" },
		],
	},
	{
		title: "Company",
		links: [
			{ name: "Blog", href: "/blog" },
			{ name: "Careers", href: "/careers" },
			{ name: "Newsroom", href: "/newsroom" },
			{ name: "About Us", href: "/about" },
		],
	},
	{
		title: "Legal",
		links: [
			{ name: "Privacy Policy", href: "/legal/privacy-policy" },
			{ name: "Terms of Service", href: "/legal/terms-of-service" },
			{ name: "Acceptable Use", href: "/legal/acceptable-use" },
			{ name: "Accessibility", href: "/legal/accessibility" },
			{ name: "Subprocessors", href: "/legal/subprocessors" },
		],
	},
];
