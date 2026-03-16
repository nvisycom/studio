export interface PricingPlan {
	id: PlanType;
	name: string;
	description: string;
	price: number | "custom";
	priceUnit: "credit" | "custom" | "free";
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
		priceUnit: "free",
		features: [
			"500 credits / month",
			"PDF & DOCX redaction",
			"Image redaction",
			"Custom redaction policy",
			"User-provided context",
			"Audit logs",
			"REST API & SDKs",
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
		priceUnit: "credit",
		features: [
			"5,000 credits / month",
			"Everything in Free",
			"Audio redaction",
			"CSV, JSON & XLSX",
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
		priceUnit: "credit",
		features: [
			"25,000 credits / month",
			"Everything in Starter",
			"SSO/SAML",
			"HIPAA & CCPA",
			"Priority support",
		],
		buttonText: "Get Business",
		buttonHref: "https://app.nvisy.com/auth/signup",
		popular: true,
		badge: "Most Popular",
	},
	{
		id: "enterprise",
		name: "Enterprise",
		description: "For large organizations",
		price: "custom",
		priceUnit: "custom",
		features: [
			"Unlimited credits",
			"Everything in Business",
			"Self-hosted deployment",
			"Custom integrations",
			"Dedicated account manager",
			"Custom SLA",
		],
		buttonText: "Contact Sales",
		buttonHref: "/contact",
	},
];
