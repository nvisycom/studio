export interface FAQItem {
	question: string;
	answer: string;
}

export interface TestimonialItem {
	quote: string;
	author: string;
	title: string;
	company: string;
	avatar?: string;
	companyLogo?: string;
	rating?: number;
}

export interface CTAButton {
	text: string;
	href?: string;
	variant?: "primary" | "secondary" | "outline";
	onClick?: string;
}

export interface StatItem {
	label: string;
	value: string;
	description?: string;
	icon?: string;
}

export interface FeatureItem {
	title: string;
	description: string;
	icon?: string;
	href?: string;
}

export interface UseCaseItem {
	title: string;
	description: string;
	icon?: string;
	industry?: string;
	benefits?: string[];
}

export interface WorkflowStep {
	title: string;
	description: string;
	icon?: string;
	step?: number;
}

export interface TrustIndicator {
	name: string;
	logo?: string;
	description?: string;
}

// Common prop interfaces
export interface BaseProps {
	title?: string;
	description?: string;
	backgroundColor?: "white" | "gray" | "dark";
	maxWidth?: "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
	centered?: boolean;
	size?: "sm" | "md" | "lg";
}

export interface FAQProps extends BaseProps {
	faqs?: FAQItem[];
}

export interface TestimonialsProps extends BaseProps {
	testimonials?: TestimonialItem[];
}

export interface CTAProps extends BaseProps {
	buttons?: CTAButton[];
}

export interface StatsProps extends BaseProps {
	stats?: StatItem[];
	columns?: 2 | 3 | 4;
}

export interface FeaturesProps extends BaseProps {
	features?: FeatureItem[];
	layout?: "grid" | "list" | "cards";
	columns?: 2 | 3 | 4;
}

export interface UseCasesProps extends BaseProps {
	useCases?: UseCaseItem[];
	industries?: string[];
}

export interface WorkflowProps extends BaseProps {
	steps?: WorkflowStep[];
	direction?: "horizontal" | "vertical";
}

export interface TrustIndicatorsProps extends BaseProps {
	indicators?: TrustIndicator[];
	variant?: "logos" | "cards" | "simple";
}

export interface HeroProps extends BaseProps {
	subtitle?: string;
	primaryCta?: CTAButton;
	secondaryCta?: CTAButton;
	image?: string;
	video?: string;
	variant?: "default" | "centered" | "split";
}

export interface IntegrationsProps extends BaseProps {
	categories?: string[];
	showCategories?: boolean;
	showSearch?: boolean;
}

// Utility types
export type BackgroundVariant = "white" | "gray" | "dark";
export type SizeVariant = "sm" | "md" | "lg";
export type LayoutVariant = "grid" | "list" | "cards";
export type AlignmentVariant = "left" | "center" | "right";
