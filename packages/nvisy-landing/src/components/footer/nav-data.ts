import type { FooterSection } from "./nav-types";

export const footerSections: FooterSection[] = [
	{
		title: "Product",
		links: [
			{ name: "Features", href: "/features" },
			{ name: "Download", href: "/download" },
			{ name: "Integrations", href: "/integrations" },
			{ name: "Pricing", href: "/pricing" },
		],
	},
	{
		title: "Resources",
		links: [
			{
				name: "Documentation",
				href: "https://docs.nvisy.com",
				isExternal: true,
			},
			{ name: "Blog", href: "/blog" },
			{ name: "Changelog", href: "/changelog" },
			{ name: "Security", href: "/security" },
			{
				name: "Status",
				href: "https://nvisy.openstatus.dev",
				isExternal: true,
			},
		],
	},
	{
		title: "Company",
		links: [
			{ name: "About", href: "/about" },
			{ name: "Customers", href: "/customers" },
			{ name: "Contact", href: "/contact" },
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
