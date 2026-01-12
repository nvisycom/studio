import type { Component } from "vue";

export interface NavigationItem {
	title: string;
	href: string;
	description?: string;
	icon: Component;
	isExternal?: boolean;
}

export interface ProductSection {
	platforms: NavigationItem[];
	opensource: NavigationItem[];
}

export interface SolutionSection {
	byUsecase: NavigationItem[];
	byCompany: NavigationItem[];
}

export interface ResourceSection {
	developers: NavigationItem[];
	support: NavigationItem[];
}
