import { h } from "vue";
import type { VNodeChild } from "vue";
import { Badge } from "#console/components/ui/badge";
import { EntityAvatar } from "#console/components/avatar";
import type { VirtualCell } from "./columns";

/** Resolves a `#cell-<key>` slot for the "custom" cell type. */
export type CustomCellRenderer = (key: string) => VNodeChild;

/**
 * Render a typed VirtualCell spec to VNodes. Pure — the only outside input is
 * `renderCustom`, which resolves the `#cell-<key>` slot for `type: "custom"`.
 */
export function renderCell(
	spec: VirtualCell,
	key: string,
	renderCustom: CustomCellRenderer,
): VNodeChild {
	switch (spec.type) {
		case "text":
			return h(
				"span",
				{
					class: [
						spec.mono ? "font-mono text-xs" : "text-sm",
						spec.muted ? "text-muted-foreground" : "text-foreground",
						spec.title ? "block truncate" : "",
					],
					title: spec.title,
				},
				spec.value,
			);
		case "primary":
			return h("div", { class: ["min-w-0", spec.maxWidth] }, [
				h(
					"p",
					{ class: "truncate font-medium text-foreground", title: spec.title },
					spec.title,
				),
				spec.subtitle
					? h(
							"p",
							{ class: "truncate text-xs text-muted-foreground" },
							spec.subtitle,
						)
					: null,
			]);
		case "badge":
			return h(
				Badge,
				{
					variant: spec.variant ?? "secondary",
					class: ["font-normal", spec.capitalize && "capitalize"],
				},
				() => spec.label,
			);
		case "avatar":
			return h("div", { class: "flex items-center gap-2" }, [
				h(EntityAvatar, {
					name: spec.name,
					src: spec.src,
					size: spec.size ?? "sm",
				}),
				h("div", { class: "min-w-0" }, [
					h(
						"p",
						{
							class: [
								"truncate text-sm text-foreground",
								spec.mono && "font-mono",
							],
						},
						spec.name,
					),
					spec.subtitle
						? h(
								"p",
								{ class: "truncate text-xs text-muted-foreground" },
								spec.subtitle,
							)
						: null,
				]),
			]);
		case "status":
			return h("div", { class: "flex items-center gap-2" }, [
				h(spec.icon, {
					size: 14,
					class: ["shrink-0", spec.iconClass, spec.spin && "animate-spin"],
				}),
				h("div", { class: "min-w-0" }, [
					h("span", { class: "text-sm text-foreground" }, spec.label),
					spec.subtitle
						? h(
								"p",
								{ class: "truncate text-xs text-muted-foreground" },
								spec.subtitle,
							)
						: null,
				]),
			]);
		case "custom":
			return renderCustom(key);
	}
}

/** Tailwind text-alignment class for a column's `align`. */
export function alignClass(align?: "left" | "right" | "center") {
	return align === "right"
		? "text-right"
		: align === "center"
			? "text-center"
			: "";
}
