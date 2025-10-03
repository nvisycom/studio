// Base prop interface shared across all sections
export interface BaseProps {
	title?: string;
	description?: string;
	backgroundColor?: "white" | "gray" | "dark";
	maxWidth?: "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
	centered?: boolean;
	size?: "sm" | "md" | "lg";
}

// Utility types
export type BackgroundVariant = "white" | "gray" | "dark";
export type SizeVariant = "sm" | "md" | "lg";
export type LayoutVariant = "grid" | "list" | "cards";
export type AlignmentVariant = "left" | "center" | "right";
