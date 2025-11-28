<script setup lang="ts">
import { ref, onMounted } from "vue";

/**
 * Cookie consent preferences structure
 */
interface CookieConsent {
	/** Always true - necessary cookies are required for basic functionality */
	necessary: boolean;
	/** Whether analytics cookies are allowed (e.g., Google Analytics, Umami) */
	analytics: boolean;
	/** Whether marketing/advertising cookies are allowed */
	marketing: boolean;
	/** Unix timestamp when consent was given */
	timestamp: number;
}

const isVisible = ref(false);
/** Local storage key for storing cookie consent preferences */
const COOKIE_CONSENT_KEY = "cookie-consent" as const;
/** Duration in milliseconds for how long consent is valid (1 year) */
const CONSENT_DURATION = 365 * 24 * 60 * 60 * 1000;

/**
 * Check if valid cookie consent was previously given
 * @returns Cookie consent object if valid, null if no consent or expired
 */
function checkExistingConsent(): CookieConsent | null {
	try {
		const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
		if (!stored) {
			return null;
		}

		const consent = JSON.parse(stored) as CookieConsent;
		const now = Date.now();

		// Check if consent is still valid
		if (now - consent.timestamp > CONSENT_DURATION) {
			localStorage.removeItem(COOKIE_CONSENT_KEY);
			return null;
		}

		return consent;
	} catch (error: unknown) {
		console.warn("Failed to parse cookie consent:", error);
		return null;
	}
}

/**
 * Save user's cookie consent preferences to localStorage
 * @param consent - Consent preferences without timestamp
 */
function saveConsent(consent: Omit<CookieConsent, "timestamp">): void {
	try {
		const consentWithTimestamp: CookieConsent = {
			...consent,
			timestamp: Date.now(),
		};

		localStorage.setItem(
			COOKIE_CONSENT_KEY,
			JSON.stringify(consentWithTimestamp),
		);
	} catch (error: unknown) {
		console.warn("Failed to save cookie consent:", error);
	}
}

/**
 * Hide the cookie consent popup
 */
function hidePopup(): void {
	isVisible.value = false;
}

/**
 * Handle user clicking "Accept All" - grants consent for all cookie types
 */
function handleAcceptAll(): void {
	const consent = {
		necessary: true,
		analytics: true,
		marketing: true,
	};

	saveConsent(consent);
	hidePopup();

	// Initialize analytics if available
	if (typeof (window as any).gtag !== "undefined") {
		(window as any).gtag("consent", "update", {
			analytics_storage: "granted",
			ad_storage: "granted",
		});
	}

	console.log("Cookie consent: All accepted");
}

/**
 * Handle user clicking "Essential Only" - only allows necessary cookies
 */
function handleNecessaryOnly(): void {
	const consent = {
		necessary: true,
		analytics: false,
		marketing: false,
	};

	saveConsent(consent);
	hidePopup();

	// Update analytics consent
	if (typeof (window as any).gtag !== "undefined") {
		(window as any).gtag("consent", "update", {
			analytics_storage: "denied",
			ad_storage: "denied",
		});
	}

	console.log("Cookie consent: Necessary only");
}

/**
 * Handle user clicking "Decline" - rejects optional cookies
 */
function handleDecline(): void {
	const consent = {
		necessary: true, // Necessary cookies are always required
		analytics: false,
		marketing: false,
	};

	saveConsent(consent);
	hidePopup();

	// Update analytics consent
	if (typeof (window as any).gtag !== "undefined") {
		(window as any).gtag("consent", "update", {
			analytics_storage: "denied",
			ad_storage: "denied",
		});
	}

	console.log("Cookie consent: Declined");
}

/**
 * Initialize cookie consent check when component mounts
 */
onMounted((): void => {
	const existingConsent = checkExistingConsent();

	if (!existingConsent) {
		// Show popup after a brief delay
		setTimeout(() => {
			isVisible.value = true;
		}, 1500);
	} else {
		// Apply existing consent
		console.log("Existing cookie consent found:", existingConsent);

		// Initialize analytics based on existing consent
		if (typeof (window as any).gtag !== "undefined") {
			(window as any).gtag("consent", "update", {
				analytics_storage: existingConsent.analytics ? "granted" : "denied",
				ad_storage: existingConsent.marketing ? "granted" : "denied",
			});
		}
	}
});
</script>

<template>
  <div
    v-if="isVisible"
    class="fixed bottom-4 right-4 z-50 w-96 h-[420px] transition-all duration-300 ease-out"
    :class="{
      'opacity-100 translate-y-0 pointer-events-auto': isVisible,
      'opacity-0 translate-y-4 pointer-events-none': !isVisible,
    }"
  >
    <div
      class="w-full h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 flex flex-col"
    >
      <!-- Header -->
      <div class="shrink-0 mb-3">
        <div class="text-2xl mb-2">🍪</div>
        <h3
          class="text-lg font-semibold text-gray-900 dark:text-white leading-tight"
        >
          We use cookies
        </h3>
      </div>

      <!-- Content -->
      <div class="flex-grow flex flex-col justify-center">
        <p
          class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4"
        >
          We use cookies to enhance your experience and analyze traffic.
          <a
            href="/legal/privacy-policy"
            class="text-black dark:text-white underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            target="_blank"
          >
            Learn more
          </a>
        </p>
      </div>

      <!-- Buttons -->
      <div class="shrink-0 space-y-2">
        <button
          @click="handleAcceptAll"
          class="w-full bg-black dark:bg-white text-white dark:text-black rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          Accept All
        </button>

        <div class="grid grid-cols-2 gap-2">
          <button
            @click="handleNecessaryOnly"
            class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-3 py-2 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Essential Only
          </button>

          <button
            @click="handleDecline"
            class="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
