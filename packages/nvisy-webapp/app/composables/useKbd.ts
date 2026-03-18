import { reactive, computed, onMounted } from "vue";
import { createSharedComposable } from "@vueuse/core";

type KbdKeysSpecificMap = {
	meta: string;
	alt: string;
	ctrl: string;
};

export const kbdKeysMap: Record<string, string> = {
	meta: "",
	ctrl: "",
	alt: "",
	win: "⊞",
	command: "⌘",
	shift: "⇧",
	control: "⌃",
	option: "⌥",
	enter: "↵",
	delete: "⌦",
	backspace: "⌫",
	escape: "Esc",
	tab: "⇥",
	capslock: "⇪",
	arrowup: "↑",
	arrowright: "→",
	arrowdown: "↓",
	arrowleft: "←",
	pageup: "⇞",
	pagedown: "⇟",
	home: "↖",
	end: "↘",
	space: "␣",
};

export type KbdKey = keyof typeof kbdKeysMap;
export type KbdKeySpecific = keyof KbdKeysSpecificMap;

const _useKbd = () => {
	const macOS = computed(
		() =>
			import.meta.client &&
			navigator &&
			navigator.userAgent &&
			navigator.userAgent.match(/Macintosh;/),
	);

	const kbdKeysSpecificMap = reactive<KbdKeysSpecificMap>({
		meta: " ",
		alt: " ",
		ctrl: " ",
	});

	onMounted(() => {
		kbdKeysSpecificMap.meta = macOS.value ? kbdKeysMap.command! : "Ctrl";
		kbdKeysSpecificMap.ctrl = macOS.value ? kbdKeysMap.control! : "Ctrl";
		kbdKeysSpecificMap.alt = macOS.value ? kbdKeysMap.option! : "Alt";
	});

	/**
	 * Get the display symbol/text for a keyboard key
	 *
	 * @example
	 * getKbdKey('meta') // '⌘' on Mac, 'Ctrl' on Windows
	 * getKbdKey('shift') // '⇧'
	 * getKbdKey('enter') // '↵'
	 * getKbdKey('a') // 'A'
	 */
	function getKbdKey(value?: KbdKey | string): string | undefined {
		if (!value) {
			return;
		}

		// Handle platform-specific keys
		if (["meta", "alt", "ctrl"].includes(value)) {
			return kbdKeysSpecificMap[value as KbdKeySpecific];
		}

		// Return mapped symbol or uppercase letter
		return kbdKeysMap[value as KbdKey] || value.toUpperCase();
	}

	return {
		macOS,
		getKbdKey,
		kbdKeysMap,
	};
};

export const useKbd = /* @__PURE__ */ createSharedComposable(_useKbd);
