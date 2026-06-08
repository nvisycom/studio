export interface NavigationItem {
	title: string;
	href: string;
	description: string;
	isExternal?: boolean;
}

export interface NavigationColumn {
	items: NavigationItem[];
}

/** A mega-menu is a set of columns (Linear-style). */
export type NavigationMenuColumns = NavigationColumn[];
