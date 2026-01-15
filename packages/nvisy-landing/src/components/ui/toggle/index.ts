import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export { default as Toggle } from "./Toggle.vue";

export const toggleVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-md text-base font-normal text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-white dark:data-[state=on]:bg-neutral-800 data-[state=on]:text-neutral-900 dark:data-[state=on]:text-white data-[state=on]:shadow-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:ring-2 focus-visible:ring-neutral-400 outline-none transition-all whitespace-nowrap",
	{
		variants: {
			variant: {
				default: "bg-transparent",
				outline:
					"border border-neutral-200 dark:border-neutral-700 bg-transparent shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
			},
			size: {
				default: "h-9 px-2 min-w-9",
				sm: "h-8 px-1.5 min-w-8",
				lg: "h-10 px-2.5 min-w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export type ToggleVariants = VariantProps<typeof toggleVariants>;
