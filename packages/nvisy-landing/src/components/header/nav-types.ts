import type { Component } from "vue";

export interface NavigationItem {
	title: string;
	href: string;
	description?: string;
	icon: Component;
	isExternal?: boolean;
}

export interface CustomerStory {
	title: string;
	href: string;
	excerpt: string;
}

export interface ProductSection {
	platforms: NavigationItem[];
	opensource: NavigationItem[];
	features: NavigationItem[];
	customers: CustomerStory[];
	comparisons: NavigationItem[];
}

export interface SolutionSection {
	integrations: NavigationItem[];
	usecase: NavigationItem[];
}

export interface ResourceSection {
	developers: NavigationItem[];
	support: NavigationItem[];
}
