export interface FooterLink {
	name: string;
	href: string;
	isExternal?: boolean;
}

export interface FooterSection {
	title: string;
	links: FooterLink[];
}
