import { computed, ref } from "vue";
import { plans, pricingConfig } from "./pricing-data";
import type { PlanType } from "./pricing-data";

// Shared reactive state
const isYearly = ref(false);

export function usePricing() {
	const formatNumber = (num: number): string => {
		if (num >= 1000) {
			return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k`;
		}
		return num.toString();
	};

	const getPrice = (planId: PlanType): number | "custom" => {
		const plan = plans.find((p) => p.id === planId);
		if (!plan || plan.price === "custom") return "custom";

		const basePrice = plan.price;
		const finalPrice = isYearly.value
			? basePrice * (1 - pricingConfig.yearlyDiscount)
			: basePrice;

		return Math.floor(finalPrice);
	};

	const freePrice = computed(() => getPrice("free"));
	const basicPrice = computed(() => getPrice("basic"));
	const businessPrice = computed(() => getPrice("business"));
	const enterprisePrice = computed(() => getPrice("enterprise"));

	const toggleBilling = () => {
		isYearly.value = !isYearly.value;
	};

	const setPricingPeriod = (yearly: boolean) => {
		isYearly.value = yearly;
	};

	return {
		isYearly,
		freePrice,
		basicPrice,
		businessPrice,
		enterprisePrice,
		formatNumber,
		getPrice,
		toggleBilling,
		setPricingPeriod,
	};
}
