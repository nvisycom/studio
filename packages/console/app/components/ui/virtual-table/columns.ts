import type { Component } from "vue";

type AvatarSize = "sm" | "md" | "lg";

/**
 * Declarative column descriptors for VirtualTable. Each column names a header
 * (already translated by the caller) and a typed cell renderer covering the
 * shapes that recur across the console's tables. The `custom` type is the
 * escape hatch: it renders a `#cell-<key>` slot.
 */
export interface VirtualColumn<TRow> {
	/** Stable key; also the slot name for `custom` cells (`#cell-<key>`). */
	key: string;
	/** Header text, already translated. Omit for the actions/select columns. */
	header?: string;
	/** Fixed width, e.g. "200px" or a tailwind width class like "w-10". */
	width?: string;
	/** Cell alignment. */
	align?: "left" | "right" | "center";
	/** The typed cell renderer. */
	cell: (row: TRow) => VirtualCell;
}

/** A typed cell spec — resolved to markup by VirtualTable. */
export type VirtualCell =
	| {
			type: "text";
			value: string;
			muted?: boolean;
			mono?: boolean;
			title?: string;
	  }
	/** A bold title with an optional muted subtitle (name + description). */
	| { type: "primary"; title: string; subtitle?: string; maxWidth?: string }
	| {
			type: "badge";
			label: string;
			variant?: BadgeVariant;
			capitalize?: boolean;
	  }
	| {
			type: "avatar";
			name: string;
			src?: string;
			size?: AvatarSize;
			subtitle?: string;
			/** Render the name in a mono font (e.g. an id/code). */
			mono?: boolean;
	  }
	| {
			type: "status";
			icon: Component;
			iconClass?: string;
			spin?: boolean;
			label: string;
			subtitle?: string;
	  }
	/** Escape hatch: render the `#cell-<column key>` slot with `{ row }`. */
	| { type: "custom" };

export type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

/** Optional empty-state descriptor (the shared muted tile). */
export interface VirtualTableEmpty {
	icon: Component;
	title: string;
	description?: string;
}
