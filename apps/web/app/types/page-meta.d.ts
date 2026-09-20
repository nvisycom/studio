declare module "#app" {
	interface PageMeta {
		/** Breadcrumb category label shown in the app header. */
		pageCategory?: string;
		/**
		 * Hide the header category breadcrumb for this page, freeing the space for
		 * the page's own header content (e.g. the studio's open-file tabs).
		 */
		hideCategory?: boolean;
	}
}

export {};
