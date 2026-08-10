import type { MaybeRef } from "vue";
import {
	useEventListener,
	useActiveElement,
	useDebounceFn,
} from "@vueuse/core";

type Handler = (e?: KeyboardEvent) => void;

export interface ShortcutConfig {
	handler: Handler;
	/** Allow shortcut when focused on an input. Can be true, false, or input name */
	usingInput?: string | boolean;
}

export interface ShortcutsConfig {
	[key: string]: ShortcutConfig | Handler | false | null | undefined;
}

export interface ShortcutsOptions {
	/** Delay before clearing chained input (default: 800ms) */
	chainDelay?: number;
}

interface Shortcut {
	handler: Handler;
	enabled: boolean;
	chained: boolean;
	key: string;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
	altKey: boolean;
}

const chainedShortcutRegex = /^[^-]+.*-.*[^-]+$/;
const combinedShortcutRegex = /^[^_]+.*_.*[^_]+$/;
const shiftableKeys = [
	"arrowleft",
	"arrowright",
	"arrowup",
	"arrowdown",
	"tab",
	"escape",
	"enter",
	"backspace",
];

/**
 * Define keyboard shortcuts with support for:
 * - Combined shortcuts: `meta_k`, `ctrl_shift_a`
 * - Chained shortcuts: `g-h` (press g then h)
 * - Auto Meta/Ctrl swap for cross-platform support
 *
 * @example
 * // Simple shortcut
 * defineShortcuts({
 *   meta_k: () => openCommandMenu(),
 *   meta_shift_a: () => acceptAll(),
 *   escape: () => close(),
 * })
 *
 * @example
 * // With options
 * defineShortcuts({
 *   meta_s: {
 *     handler: () => save(),
 *     usingInput: true, // Allow when typing in input
 *   },
 * })
 *
 * @example
 * // Chained shortcuts (press g then h)
 * defineShortcuts({
 *   'g-h': () => goHome(),
 * })
 */
export function defineShortcuts(
	config: MaybeRef<ShortcutsConfig>,
	options: ShortcutsOptions = {},
) {
	const chainedInputs = ref<string[]>([]);
	const clearChainedInput = () => {
		chainedInputs.value.splice(0, chainedInputs.value.length);
	};
	const debouncedClearChainedInput = useDebounceFn(
		clearChainedInput,
		options.chainDelay ?? 800,
	);

	const { macOS } = useKbd();
	const activeElement = useActiveElement();

	const usingInput = computed(() => {
		const tagName = activeElement.value?.tagName;
		const contentEditable = activeElement.value?.contentEditable;

		const isUsingInput = !!(
			tagName === "INPUT" ||
			tagName === "TEXTAREA" ||
			contentEditable === "true" ||
			contentEditable === "plaintext-only"
		);

		if (isUsingInput) {
			return (
				((activeElement.value as HTMLInputElement)?.name as string) || true
			);
		}

		return false;
	});

	const shortcuts = computed<Shortcut[]>(() => {
		return Object.entries(toValue(config))
			.map(([key, shortcutConfig]) => {
				if (!shortcutConfig) {
					return null;
				}

				let shortcut: Partial<Shortcut>;

				// Validate key format
				if (
					key.includes("-") &&
					key !== "-" &&
					!key.includes("_") &&
					!key.match(chainedShortcutRegex)?.length
				) {
					console.trace(`[Shortcut] Invalid key: "${key}"`);
				}

				if (
					key.includes("_") &&
					key !== "_" &&
					!key.match(combinedShortcutRegex)?.length
				) {
					console.trace(`[Shortcut] Invalid key: "${key}"`);
				}

				const chained = key.includes("-") && key !== "-" && !key.includes("_");

				if (chained) {
					shortcut = {
						key: key.toLowerCase(),
						metaKey: false,
						ctrlKey: false,
						shiftKey: false,
						altKey: false,
					};
				} else {
					const keySplit = key.toLowerCase().split("_");
					const baseKey = keySplit
						.filter(
							(k) =>
								!["meta", "command", "ctrl", "shift", "alt", "option"].includes(
									k,
								),
						)
						.join("_");

					shortcut = {
						key: baseKey,
						metaKey: keySplit.includes("meta") || keySplit.includes("command"),
						ctrlKey: keySplit.includes("ctrl"),
						shiftKey: keySplit.includes("shift"),
						altKey: keySplit.includes("alt") || keySplit.includes("option"),
					};
				}

				shortcut.chained = chained;

				// Convert Meta to Ctrl for non-macOS
				if (!macOS.value && shortcut.metaKey && !shortcut.ctrlKey) {
					shortcut.metaKey = false;
					shortcut.ctrlKey = true;
				}

				// Get handler
				if (typeof shortcutConfig === "function") {
					shortcut.handler = shortcutConfig;
				} else if (typeof shortcutConfig === "object") {
					shortcut.handler = shortcutConfig.handler;
				}

				if (!shortcut.handler) {
					console.trace("[Shortcut] Invalid value");
					return null;
				}

				// Check if enabled based on input focus
				let enabled = true;
				if (!(shortcutConfig as ShortcutConfig).usingInput) {
					enabled = !usingInput.value;
				} else if (
					typeof (shortcutConfig as ShortcutConfig).usingInput === "string"
				) {
					enabled =
						usingInput.value === (shortcutConfig as ShortcutConfig).usingInput;
				}
				shortcut.enabled = enabled;

				return shortcut;
			})
			.filter(Boolean) as Shortcut[];
	});

	const onKeyDown = (e: KeyboardEvent) => {
		if (!e.key) return;

		const alphabetKey = /^[a-z]{1}$/i.test(e.key);
		const shiftableKey = shiftableKeys.includes(e.key.toLowerCase());

		// Handle chained shortcuts
		chainedInputs.value.push(e.key);
		if (chainedInputs.value.length >= 2) {
			const chainedKey = chainedInputs.value.slice(-2).join("-");

			for (const shortcut of shortcuts.value.filter((s) => s.chained)) {
				if (shortcut.key !== chainedKey) continue;

				if (shortcut.enabled) {
					e.preventDefault();
					shortcut.handler(e);
				}
				clearChainedInput();
				return;
			}
		}

		// Handle standard shortcuts
		for (const shortcut of shortcuts.value.filter((s) => !s.chained)) {
			if (e.key.toLowerCase() !== shortcut.key) continue;
			if (e.metaKey !== shortcut.metaKey) continue;
			if (e.ctrlKey !== shortcut.ctrlKey) continue;
			if ((alphabetKey || shiftableKey) && e.shiftKey !== shortcut.shiftKey)
				continue;

			if (shortcut.enabled) {
				e.preventDefault();
				shortcut.handler(e);
			}
			clearChainedInput();
			return;
		}

		debouncedClearChainedInput();
	};

	return useEventListener("keydown", onKeyDown);
}
