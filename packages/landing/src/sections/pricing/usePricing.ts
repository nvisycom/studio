import { ref, computed } from "vue";
import { plans, pricingConfig } from "./pricing-data";
import type { PlanType } from "./types";

export function usePricing() {
	// Reactive state
	const isYearly = ref(false);
	const starterRedactions = ref(pricingConfig.defaultStarterRedactions);
	const proRedactions = ref(pricingConfig.defaultProRedactions);

	// Utility functions
	const formatNumber = (num: number): string => {
		if (num >= 1000) {
			return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + "k";
		}
		return num.toString();
	};

	const calculatePrice = (planId: PlanType, redactions: number): number => {
		const plan = plans.find((p) => p.id === planId);
		if (!plan || plan.basePrice === undefined) return 0;

		if (planId === "starter") {
			const basePrice = plan.basePrice || 0;
			const baseRedactions = plan.baseRedactions || 100;

			// If redactions are within the base amount, it's free
			if (redactions <= baseRedactions) {
				return 0;
			}

			// Calculate additional cost for extra redactions
			// For starter, charge $5 per additional 50 redactions
			const additionalRedactions = redactions - baseRedactions;
			const additionalCost = Math.ceil(additionalRedactions / 50) * 5;

			const totalPrice = basePrice + additionalCost;
			const finalPrice = isYearly.value
				? Math.round(totalPrice * (1 - pricingConfig.yearlyDiscount))
				: totalPrice;
			return finalPrice;
		}

		if (planId === "pro") {
			const basePrice = plan.basePrice || 29;
			const baseRedactions = plan.baseRedactions || 1000;
			const additionalCost =
				Math.max(0, Math.ceil((redactions - baseRedactions) / 500)) *
				(plan.additionalCostPer500 || 5);
			const totalPrice = basePrice + additionalCost;
			const finalPrice = isYearly.value
				? Math.round(totalPrice * (1 - pricingConfig.yearlyDiscount))
				: totalPrice;
			return finalPrice;
		}

		return plan.basePrice || 0;
	};

	// Computed properties
	const starterPrice = computed(() =>
		calculatePrice("starter", starterRedactions.value),
	);

	const proPrice = computed(() => calculatePrice("pro", proRedactions.value));

	// Helper functions
	const getRedactionCount = (planId: PlanType): number => {
		if (planId === "starter") {
			return starterRedactions.value;
		} else if (planId === "pro") {
			return proRedactions.value;
		}

		return 0;
	};

	const setRedactionCount = (planId: PlanType, value: number) => {
		console.log("Setting redaction count for", planId, "to", value);

		if (planId === "starter") {
			starterRedactions.value = value;
		} else if (planId === "pro") {
			proRedactions.value = value;
		}
	};

	const getSliderStep = (planId: string): number => {
		if (planId === "starter") {
			return pricingConfig.starterSliderStep;
		} else if (planId === "pro") {
			return pricingConfig.proSliderStep;
		}

		return 1;
	};

	const toggleBilling = () => {
		isYearly.value = !isYearly.value;
	};

	const setPricingPeriod = (yearly: boolean) => {
		isYearly.value = yearly;
	};

	// Return all the reactive state and functions
	return {
		// State
		isYearly,
		starterRedactions,
		proRedactions,

		// Computed
		starterPrice,
		proPrice,

		// Functions
		formatNumber,
		calculatePrice,
		getRedactionCount,
		setRedactionCount,
		getSliderStep,
		toggleBilling,
		setPricingPeriod,
	};
}
