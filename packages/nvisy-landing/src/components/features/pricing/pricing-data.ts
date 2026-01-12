export interface PricingPlan {
	id: PlanType;
	name: string;
	description: string;
	price: number | "custom";
	features: string[];
	buttonText: string;
	buttonVariant: "primary" | "secondary" | "outline";
	pagesIncluded?: number;
	popular?: boolean;
	badge?: string;
}

export interface PricingConfig {
	yearlyDiscount: number;
}

// Plan types
export type PlanType = "basic" | "professional" | "enterprise";

export const plans: PricingPlan[] = [
	{
		id: "basic",
		name: "Basic",
		description: "Perfect for individuals and small teams",
		price: 0,
		pagesIncluded: 100,
		features: [
			"Unlimited workspaces",
			"Team collaboration",
			"API access",
			"Community support",
			"5GB storage",
		],
		buttonText: "Get Started Free",
		buttonVariant: "outline",
	},
	{
		id: "professional",
		name: "Professional",
		description: "Best for growing businesses and teams",
		price: 49,
		pagesIncluded: 1000,
		features: [
			"Everything in Basic",
			"Webhooks",
			"Integrations",
			"Priority support",
			"20GB storage",
		],
		buttonText: "Start Pro Trial",
		buttonVariant: "primary",
		popular: true,
		badge: "Most Popular",
	},
	{
		id: "enterprise",
		name: "Enterprise",
		description: "Tailored solutions for large organizations",
		price: "custom",
		features: [
			"Everything in Professional",
			"Unlimited storage",
			"24/7 dedicated support",
			"Custom integrations",
			"SLA guarantee",
			"On-premise deployment",
		],
		buttonText: "Contact Sales",
		buttonVariant: "outline",
	},
];

export const pricingConfig: PricingConfig = {
	yearlyDiscount: 0.2, // 20% discount
};
