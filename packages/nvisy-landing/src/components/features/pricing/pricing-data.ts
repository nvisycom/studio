export interface PricingPlan {
	id: PlanType;
	name: string;
	description: string;
	price: number | "custom";
	features: string[];
	buttonText: string;
	buttonVariant: "primary" | "secondary" | "outline";
	storage?: string;
	queries?: string;
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
		storage: "5GB",
		queries: "1,000",
		features: [
			"Unlimited workspaces",
			"Team collaboration",
			"API access",
			"Community support",
		],
		buttonText: "Get Started Free",
		buttonVariant: "outline",
	},
	{
		id: "professional",
		name: "Professional",
		description: "Best for growing businesses and teams",
		price: 49,
		storage: "20GB",
		queries: "10,000",
		features: [
			"Everything in Basic",
			"Integrations & Webhooks",
			"Priority support",
			"On-premise deployment",
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
		storage: "Unlimited",
		queries: "Unlimited",
		features: [
			"Everything in Professional",
			"24/7 dedicated support",
			"Custom integrations",
			"SLA guarantee",
		],
		buttonText: "Contact Sales",
		buttonVariant: "outline",
	},
];

export const pricingConfig: PricingConfig = {
	yearlyDiscount: 0.2, // 20% discount
};
