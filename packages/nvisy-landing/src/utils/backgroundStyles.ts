export const BACKGROUND_CLASSES = {
	white: "bg-white dark:bg-black",
	gray: "bg-neutral-50 dark:bg-neutral-950",
	dark: "bg-neutral-900 dark:bg-black",
	solid: "bg-white dark:bg-black",
	gradient:
		"bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-neutral-900 dark:via-black dark:to-neutral-900",
	none: "bg-transparent",
};

export function getBackgroundClass(
	variant: "white" | "gray" | "dark" | "solid" | "gradient" | "none" = "white",
): string {
	return BACKGROUND_CLASSES[variant];
}
