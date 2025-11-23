import { computed, ref } from "vue";
import { plans, pricingConfig } from "./pricing-data";
import type { PlanType } from "./pricing-data";

// Shared reactive state (singleton pattern to ensure all components use the same state)
const isYearly = ref(false);
const basicRedactions = ref(pricingConfig.defaultBasicRedactions);
const professionalRedactions = ref(pricingConfig.defaultProfessionalRedactions);

export function usePricing() {
	// Use shared state instead of creating new instances

	// Utility functions
	const formatNumber = (num: number): string => {
		if (num >= 1000) {
			return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + "k";
		}
		return num.toString();
	};

	const calculatePrice = (planId: PlanType, redactions: number): number => {
		const plan = plans.find((p) => p.id === planId);
		if (!plan || !plan.pricePerDocument) return 0;

		const basePrice = plan.basePrice || 0;
		const baseRedactions = plan.baseRedactions || 0;
		const pricePerDocument = plan.pricePerDocument || 0;

		// Base price + additional documents (beyond baseRedactions) charged per document
		const chargeableDocuments = Math.max(0, redactions - baseRedactions);
		const totalPrice = basePrice + chargeableDocuments * pricePerDocument;

		// Apply yearly discount if applicable
		const finalPrice = isYearly.value
			? totalPrice * (1 - pricingConfig.yearlyDiscount)
			: totalPrice;

		return Math.floor(finalPrice); // Round down to whole number
	};

	// Computed properties
	const basicPrice = computed(() =>
		calculatePrice("basic", basicRedactions.value),
	);

	const professionalPrice = computed(() =>
		calculatePrice("professional", professionalRedactions.value),
	);

	// Helper functions
	const getRedactionCount = (planId: PlanType): number => {
		if (planId === "basic") {
			return basicRedactions.value;
		} else if (planId === "professional") {
			return professionalRedactions.value;
		}

		return 0;
	};

	const setRedactionCount = (planId: PlanType, value: number) => {
		console.log("Setting redaction count for", planId, "to", value);

		if (planId === "basic") {
			basicRedactions.value = value;
		} else if (planId === "professional") {
			professionalRedactions.value = value;
		}
	};

	const getSliderStep = (planId: string): number => {
		if (planId === "basic") {
			return pricingConfig.basicSliderStep;
		} else if (planId === "professional") {
			return pricingConfig.professionalSliderStep;
		}

		return 1;
	};

	const toggleBilling = () => {
		console.log("Toggling billing from", isYearly.value, "to", !isYearly.value);
		isYearly.value = !isYearly.value;
	};

	const setPricingPeriod = (yearly: boolean) => {
		isYearly.value = yearly;
	};

	// Return all the reactive state and functions
	return {
		// State
		isYearly,
		basicRedactions,
		professionalRedactions,

		// Computed
		basicPrice,
		professionalPrice,

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
