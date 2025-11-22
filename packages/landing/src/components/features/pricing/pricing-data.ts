export interface PricingPlan {
	id: PlanType;
	name: string;
	description: string;
	features: string[];
	buttonText: string;
	buttonVariant: "primary" | "secondary" | "outline";
	hasSlider?: boolean;
	minRedactions?: number;
	maxRedactions?: number;
	basePrice?: number;
	baseRedactions?: number;
	pricePerDocument?: number;
	popular?: boolean;
	badge?: string;
}

export interface PricingConfig {
	yearlyDiscount: number;
	defaultBasicRedactions: number;
	defaultProfessionalRedactions: number;
	basicSliderStep: number;
	professionalSliderStep: number;
}

// Plan types
export type PlanType = "basic" | "professional" | "enterprise";

export const plans: PricingPlan[] = [
	{
		id: "basic",
		name: "Basic",
		description: "Perfect for individuals and small projects",
		features: [
			"Unlimited projects",
			"Team collaboration",
			"API access & webhooks",
			"Community support",
			"5GB storage",
		],
		buttonText: "Get Started Free",
		buttonVariant: "outline",
		hasSlider: true,
		minRedactions: 10,
		maxRedactions: 50,
		basePrice: 0,
		baseRedactions: 10,
		pricePerDocument: 1.0,
	},
	{
		id: "professional",
		name: "Professional",
		description: "Best for growing businesses and teams",
		features: [
			"Everything in Basic",
			"AI Insights",
			"Integrations",
			"Priority support",
			"20GB storage",
		],
		buttonText: "Start Pro Trial",
		buttonVariant: "primary",
		hasSlider: true,
		minRedactions: 50,
		maxRedactions: 500,
		basePrice: 49,
		baseRedactions: 50,
		pricePerDocument: 0.6,
		popular: true,
		badge: "Most Popular",
	},
	{
		id: "enterprise",
		name: "Enterprise",
		description: "Tailored solutions for large organizations",
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
	defaultBasicRedactions: 10,
	defaultProfessionalRedactions: 50,
	basicSliderStep: 10,
	professionalSliderStep: 50,
};
