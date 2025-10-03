import type { PricingPlan, PricingConfig } from "./types";

export const plans: PricingPlan[] = [
	{
		id: "starter",
		name: "Starter",
		description: "Perfect for individuals and small projects",
		features: [
			"Up to 3 projects",
			"Basic analytics",
			"Community support",
			"5GB storage",
		],
		buttonText: "Get Started Free",
		buttonVariant: "outline",
		hasSlider: true,
		minRedactions: 50,
		maxRedactions: 500,
		basePrice: 0,
		baseRedactions: 100,
		additionalCostPer500: 50,
	},
	{
		id: "pro",
		name: "Pro",
		description: "Best for growing businesses and teams",
		features: [
			"Unlimited projects",
			"Advanced analytics",
			"Priority support",
			"100GB storage",
			"Team collaboration",
			"API access",
		],
		buttonText: "Start Pro Trial",
		buttonVariant: "primary",
		hasSlider: true,
		minRedactions: 500,
		maxRedactions: 5000,
		basePrice: 29,
		baseRedactions: 1000,
		additionalCostPer500: 5,
	},
	{
		id: "enterprise",
		name: "Enterprise",
		description: "Tailored solutions for large organizations",
		features: [
			"Everything in Pro",
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
	defaultStarterRedactions: 100,
	defaultProRedactions: 1000,
	starterSliderStep: 50,
	proSliderStep: 500,
};
