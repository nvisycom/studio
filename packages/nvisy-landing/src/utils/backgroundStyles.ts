export const BACKGROUND_CLASSES = {
	white: "bg-white dark:bg-black",
	gray: "bg-neutral-50 dark:bg-neutral-950",
	dark: "bg-neutral-900 dark:bg-black",
	solid: "bg-white dark:bg-black",
	gradient:
		"bg-gradient-to-br from-blue-50 via-white to-pink-50 dark:from-blue-950/20 dark:via-black dark:to-pink-950/20 backdrop-blur-3xl",
	none: "bg-transparent",
};

export type BackgroundVariant =
	| "white"
	| "gray"
	| "dark"
	| "solid"
	| "gradient"
	| "none";

export function getBackgroundClass(
	variant: BackgroundVariant = "white",
): string {
	return BACKGROUND_CLASSES[variant];
}
