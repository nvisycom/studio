const base =
	"w-full font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]";

const popular =
	"bg-foreground text-background hover:bg-foreground/90 shadow-sm py-3 px-6";

const standard = "bg-accent hover:bg-accent/80 text-foreground py-2.5 px-5";

export function buttonClasses(isPopular?: boolean): string[] {
	return [base, isPopular ? popular : standard];
}
