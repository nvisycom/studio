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
export type PlanType = "free" | "basic" | "business" | "enterprise";

export const plans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "For individuals getting started",
    price: 0,
    storage: "1GB",
    queries: "100",
    features: [
      "1 workspace",
      "Basic document processing",
      "Community support",
      "7-day data retention",
    ],
    buttonText: "Get Started",
    buttonVariant: "outline",
  },
  {
    id: "basic",
    name: "Basic",
    description: "For small teams and projects",
    price: 29,
    storage: "10GB",
    queries: "2,500",
    features: [
      "5 workspaces",
      "Team collaboration",
      "API access",
      "Email support",
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "outline",
  },
  {
    id: "business",
    name: "Business",
    description: "For growing businesses",
    price: 99,
    storage: "50GB",
    queries: "25,000",
    features: [
      "Unlimited workspaces",
      "Integrations & Webhooks",
      "Priority support",
      "Advanced analytics",
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
    storage: "Unlimited",
    queries: "Unlimited",
    features: [
      "Everything in Business",
      "On-premise deployment",
      "24/7 dedicated support",
      "Custom SLA",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline",
  },
];

export const pricingConfig: PricingConfig = {
  yearlyDiscount: 0.2, // 20% discount
};
