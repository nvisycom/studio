import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export { default as Button } from "./Button.vue";

export const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
	{
		variants: {
			variant: {
				default: "bg-foreground text-background hover:opacity-90 shadow-sm",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
				outline:
					"border border-border bg-background hover:bg-accent hover:text-accent-foreground",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-foreground underline-offset-4 hover:underline",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
				glow: "bg-foreground text-background shadow-lg shadow-foreground/10 hover:shadow-xl hover:shadow-foreground/20 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
				"gradient-border":
					"relative bg-background text-foreground hover:text-foreground border-0 before:absolute before:inset-0 before:rounded-[inherit] before:p-[1px] before:bg-gradient-to-r before:from-foreground/40 before:via-foreground before:to-foreground/40 before:content-[''] before:-z-10 after:absolute after:inset-[1px] after:rounded-[calc(inherit-1px)] after:bg-background after:content-[''] after:-z-10 shadow-sm hover:shadow-md",
			},
			size: {
				default: "h-9 px-4 text-sm rounded-lg",
				sm: "h-8 px-3 text-sm rounded-md",
				lg: "h-11 px-6 text-sm rounded-lg",
				xl: "h-12 px-8 text-base rounded-xl",
				icon: "size-9 rounded-lg",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
