import { ref } from "vue";

// Shared state across all instances
const mobileMenuOpen = ref(false);

export function useMobileMenu() {
	const toggleMobileMenu = () => {
		mobileMenuOpen.value = !mobileMenuOpen.value;
	};

	const closeMobileMenu = () => {
		mobileMenuOpen.value = false;
	};

	const openMobileMenu = () => {
		mobileMenuOpen.value = true;
	};

	return {
		mobileMenuOpen,
		toggleMobileMenu,
		closeMobileMenu,
		openMobileMenu,
	};
}
