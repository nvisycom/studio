export interface PricingPlan {
	id: PlanType;
	name: string;
	description: string;
	price: number | "custom";
	highlights: string[];
	features: string[];
	buttonText: string;
	buttonHref: string;
	popular?: boolean;
	badge?: string;
}

// Plan types
export type PlanType = "free" | "starter" | "business" | "enterprise";

export const plans: PricingPlan[] = [
	{
		id: "free",
		name: "Free",
		description: "For individuals getting started",
		price: 0,
		highlights: ["500 credits / month", "2 workspaces", "Unlimited members"],
		features: [
			"PDF, DOCX & image redaction",
			"Custom redaction policy",
			"Google & Microsoft SSO",
			"REST API & SDKs",
			"Audit logs",
			"Community support",
		],
		buttonText: "Get Started",
		buttonHref: "https://app.nvisy.com/auth/signup",
	},
	{
		id: "starter",
		name: "Starter",
		description: "For small teams and startups",
		price: 49,
		highlights: ["5,000 credits / month", "5 workspaces", "Unlimited members"],
		features: [
			"Everything in Free",
			"Audio, CSV, JSON & XLSX",
			"Batch processing",
			"Compliance reports",
			"Webhooks & Integrations",
			"Email support",
		],
		buttonText: "Start Free Trial",
		buttonHref: "https://app.nvisy.com/auth/signup",
	},
	{
		id: "business",
		name: "Business",
		description: "For growing businesses",
		price: 199,
		highlights: [
			"25,000 credits / month",
			"Unlimited workspaces",
			"Unlimited members",
		],
		features: [
			"Everything in Starter",
			"SSO/SAML",
			"HIPAA & CCPA",
			"Webhooks & Integrations",
			"Compliance reports",
			"Priority support",
		],
		buttonText: "Start Trial",
		buttonHref: "https://app.nvisy.com/auth/signup",
		popular: true,
		badge: "Most Popular",
	},
	{
		id: "enterprise",
		name: "Enterprise",
		description: "For large organizations",
		price: "custom",
		highlights: [
			"Unlimited credits",
			"Unlimited workspaces",
			"Unlimited members",
		],
		features: [
			"Everything in Business",
			"Self-hosted deployment",
			"Custom integrations",
			"Custom SLA",
		],
		buttonText: "Contact Sales",
		buttonHref: "/contact",
	},
];
