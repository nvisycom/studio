/**
 * Global scroll reveal animation system
 * Add `data-reveal` attribute to any element to enable scroll-triggered animations
 * Use `--reveal-delay` CSS variable to stagger animations
 */

export function initScrollReveal() {
	const observerOptions: IntersectionObserverInit = {
		threshold: 0.1,
		rootMargin: "0px 0px -50px 0px",
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add("is-visible");
				observer.unobserve(entry.target);
			}
		});
	}, observerOptions);

	document.querySelectorAll("[data-reveal]").forEach((el) => {
		observer.observe(el);
	});
}

// Auto-initialize on DOM ready
if (typeof document !== "undefined") {
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initScrollReveal);
	} else {
		initScrollReveal();
	}

	// Re-initialize on Astro page transitions
	document.addEventListener("astro:page-load", initScrollReveal);
}
