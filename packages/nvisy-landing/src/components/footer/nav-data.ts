import type { FooterSection } from "./nav-types";

export const footerSections: FooterSection[] = [
	{
		title: "Product",
		links: [
			{ name: "Nvisy Server", href: "/products/server" },
			{ name: "Nvisy Studio", href: "/products/studio" },
			{
				name: "Documentation",
				href: "https://docs.nvisy.com",
				isExternal: true,
			},
			{
				name: "API Reference",
				href: "https://docs.nvisy.com/api-reference",
				isExternal: true,
			},
		],
	},
	{
		title: "Resources",
		links: [
			{ name: "Blog", href: "/blog" },
			{ name: "Changelog", href: "/changelog" },
			{ name: "Customers", href: "/customers" },
			{ name: "Integrations", href: "/integrations" },
			{ name: "Pricing", href: "/pricing" },
		],
	},
	{
		title: "Company",
		links: [
			{ name: "About", href: "/about" },
			{
				name: "Careers",
				href: "https://www.linkedin.com/company/nvisy/jobs/",
				isExternal: true,
			},
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
