export interface BaseProps {
	title?: string;
	description?: string;
	backgroundColor?: BackgroundVariant;
	maxWidth?: MaxWidthVariant;
	centered?: boolean;
}

export interface ButtonProps {
	text: string;
	href?: string;
	variant?: ButtonVariant;
	onClick?: string;
	icon?: IconType;
	external?: boolean;
}

export type BackgroundVariant = "solid" | "gradient" | "none";
export type LayoutVariant = "grid" | "list" | "cards";
export type AlignmentVariant = "left" | "center" | "right";
export type MaxWidthVariant =
	| "sm"
	| "md"
	| "lg"
	| "xl"
	| "2xl"
	| "3xl"
	| "4xl"
	| "5xl"
	| "6xl"
	| "7xl"
	| "full";
export type ButtonVariant = "primary" | "secondary" | "outline";
export type IconType = "github" | "mail" | "external" | "play" | "arrow";
