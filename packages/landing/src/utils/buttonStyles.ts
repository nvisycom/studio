export function getButtonClasses(
	variant: "primary" | "secondary" | "outline" = "primary",
): string {
	const baseClasses =
		"inline-flex items-center justify-center gap-2 font-medium py-3 px-6 md:py-4 md:px-8 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-base md:text-lg";

	const variantClasses = {
		primary:
			"bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 focus:ring-black dark:focus:ring-white shadow-sm hover:shadow-md",
		secondary:
			"bg-white dark:bg-black/50 text-black dark:text-white border-2 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/20 dark:hover:border-white/20 focus:ring-black/10 dark:focus:ring-white/10",
		outline:
			"bg-white dark:bg-black/50 text-black dark:text-white border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/20 dark:hover:border-white/20 focus:ring-black/10 dark:focus:ring-white/10",
	};

	return `${baseClasses} ${variantClasses[variant]}`;
}
