export interface PricingPlan {
	id: PlanType;
	name: string;
	description: string;
	price: number | "custom";
	pages: string;
	storage: string;
	features: string[];
	buttonText: string;
	buttonVariant: "primary" | "secondary" | "outline";
	popular?: boolean;
	badge?: string;
}

export interface PricingConfig {
	yearlyDiscount: number;
}

// Plan types
export type PlanType = "free" | "basic" | "business" | "enterprise";

export const plans: PricingPlan[] = [
	{
		id: "free",
		name: "Free",
		description: "For individuals getting started",
		price: 0,
		pages: "100",
		storage: "1GB",
		features: [
			"PDF & DOCX support",
			"OCR & Table extraction",
			"Image & Layout extraction",
		],
		buttonText: "Get Started",
		buttonVariant: "outline",
	},
	{
		id: "basic",
		name: "Basic",
		description: "For small teams and projects",
		price: 29,
		pages: "2,500",
		storage: "10GB",
		features: [
			"Spreadsheet extraction",
			"JSON & CSV export",
			"Summarization",
			"Batch processing",
		],
		buttonText: "Start Free Trial",
		buttonVariant: "outline",
	},
	{
		id: "business",
		name: "Business",
		description: "For growing businesses",
		price: 99,
		pages: "25,000",
		storage: "50GB",
		features: [
			"Custom schemas",
			"Webhooks & Integrations",
			"SSO/SAML",
			"Priority support",
		],
		buttonText: "Start Free Trial",
		buttonVariant: "primary",
		popular: true,
		badge: "Most Popular",
	},
	{
		id: "enterprise",
		name: "Enterprise",
		description: "For large organizations",
		price: "custom",
		pages: "Unlimited",
		storage: "Unlimited",
		features: [
			"On-premise deployment",
			"Dedicated account manager",
			"Custom SLA",
			"Custom integrations",
		],
		buttonText: "Contact Sales",
		buttonVariant: "outline",
	},
];

export const pricingConfig: PricingConfig = {
	yearlyDiscount: 0.2, // 20% discount
};
