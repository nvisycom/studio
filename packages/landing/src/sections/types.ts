// Base prop interface shared across all sections
export interface BaseProps {
	title?: string;
	description?: string;
	backgroundColor?: BackgroundVariant;
	maxWidth?: "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
	centered?: boolean;
	size?: SizeVariant;
}

// Utility types
export type BackgroundVariant = "white" | "gray" | "dark";
export type SizeVariant = "sm" | "md" | "lg";
export type LayoutVariant = "grid" | "list" | "cards";
export type AlignmentVariant = "left" | "center" | "right";
