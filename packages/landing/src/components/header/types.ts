import type { Component } from "vue";

export interface NavigationItem {
	title: string;
	href: string;
	description?: string;
	icon: Component;
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
	stage: NavigationItem[];
}

export interface BlogPost {
	title: string;
	href: string;
	excerpt: string;
}

export interface CustomerStory {
	title: string;
	href: string;
	excerpt: string;
}

export interface ResourceSection {
	developers: NavigationItem[];
	support: NavigationItem[];
	blog: BlogPost[];
}

export interface NavigationDropdown {
	trigger: string;
	items: NavigationItem[] | ProductSection | SolutionSection | ResourceSection;
}

export interface HeaderProps {
	showAuth?: boolean;
	variant?: "default" | "minimal";
}

export interface MobileMenuProps {
	isOpen: boolean;
	onClose: () => void;
}

export interface DropdownProps {
	trigger: string;
	items: NavigationItem[];
	align?: "left" | "center" | "right";
}
