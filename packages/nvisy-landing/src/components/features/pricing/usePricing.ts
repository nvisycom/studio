import { computed } from "vue";
import { plans } from "./pricing-data";
import type { PlanType } from "./pricing-data";

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
		return plan.price;
	};

	const freePrice = computed(() => getPrice("free"));
	const starterPrice = computed(() => getPrice("starter"));
	const businessPrice = computed(() => getPrice("business"));
	const enterprisePrice = computed(() => getPrice("enterprise"));

	return {
		freePrice,
		starterPrice,
		businessPrice,
		enterprisePrice,
		formatNumber,
		getPrice,
	};
}
