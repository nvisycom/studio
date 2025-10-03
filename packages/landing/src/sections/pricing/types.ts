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
	additionalCostPer500?: number;
	popular?: boolean;
	badge?: string;
}

export interface PricingConfig {
	yearlyDiscount: number;
	defaultStarterRedactions: number;
	defaultProRedactions: number;
	starterSliderStep: number;
	proSliderStep: number;
}

export interface PricingCardsProps {
	plans?: PricingPlan[];
	config?: PricingConfig;
	showBillingToggle?: boolean;
	defaultBilling?: "monthly" | "yearly";
}

export interface BillingToggleProps {
	isYearly: boolean;
	onToggle: (isYearly: boolean) => void;
	yearlyDiscount?: number;
}

export interface PricingCardProps {
	plan: PricingPlan;
	price: number;
	redactions: number;
	onRedactionsChange: (value: number) => void;
	isYearly?: boolean;
}

export interface SliderConfig {
	min: number;
	max: number;
	step: number;
	value: number;
}

// Button variant types
export type ButtonVariant = "primary" | "secondary" | "outline";

// Billing period types
export type BillingPeriod = "monthly" | "yearly";

// Plan types
export type PlanType = "starter" | "pro" | "enterprise";

// Price calculation utilities
export interface PriceCalculation {
	basePrice: number;
	additionalCost: number;
	totalPrice: number;
	discountedPrice: number;
	savings?: number;
}

// Feature types
export interface PricingFeature {
	name: string;
	included: boolean;
	description?: string;
	limit?: string | number;
}

// Comparison types
export interface PlanComparison {
	feature: string;
	starter: string | boolean;
	pro: string | boolean;
	enterprise: string | boolean;
}

// FAQ types for pricing
export interface PricingFAQ {
	question: string;
	answer: string;
	category?: "billing" | "features" | "support" | "general";
}

// Utility types
export type PlanFeatures = Record<PlanType, PricingFeature[]>;
export type PlanPricing = Record<PlanType, PriceCalculation>;
