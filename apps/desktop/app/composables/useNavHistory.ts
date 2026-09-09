import { readonly, ref } from "vue";

/**
 * Tracks back/forward availability for the desktop title-bar nav buttons.
 *
 * Neither Vue Router nor the History API exposes a "can go forward" flag, so we
 * derive position authoritatively from state we stamp onto each history entry:
 *
 * - Every entry carries its own `navIndex` in `history.state`. Because the
 *   browser preserves per-entry state across back/forward, the CURRENT entry's
 *   stored index *is* our position — we read it back after each navigation rather
 *   than inferring direction from the order of `popstate` vs. the router hook
 *   (which isn't guaranteed and was the fragile part of the old approach).
 * - `maxIndex` is the furthest index we've stamped on the current branch; forward
 *   is possible exactly while `position < maxIndex`. A fresh push past a
 *   backed-up point rewrites the tail, so `maxIndex` drops to the new position —
 *   browser-style forward-tail truncation.
 *
 * `canForward` is therefore exact for in-app navigation, not a heuristic.
 *
 * Module-level singleton so the one title bar shares a single tracker.
 */

interface NavState {
	navIndex?: number;
}

const position = ref(0);
// Furthest index reachable by going forward from here on the current branch.
const maxIndex = ref(0);
const canBack = ref(false);
const canForward = ref(false);

let installed = false;

function currentState(): NavState {
	return (window.history.state as NavState | null) ?? {};
}

function stampIndex(index: number) {
	try {
		window.history.replaceState({ ...currentState(), navIndex: index }, "");
	} catch {
		// Non-fatal — a foreign/blocked entry just falls back to step navigation.
	}
}

function recompute() {
	canBack.value = position.value > 0;
	// Never offer forward past the real end of the session history.
	canForward.value =
		position.value < maxIndex.value &&
		position.value < window.history.length - 1;
}

export function useNavHistory() {
	const router = useRouter();

	function install() {
		if (installed) return;
		installed = true;

		// Seed the current (first) entry with an index if it has none, so later
		// reads have something authoritative to return to.
		const seeded = currentState().navIndex;
		if (typeof seeded === "number") {
			position.value = seeded;
			maxIndex.value = Math.max(maxIndex.value, seeded);
		} else {
			stampIndex(position.value);
		}

		router.afterEach((to, from) => {
			if (to.fullPath === from.fullPath) return;

			const stored = currentState().navIndex;
			if (typeof stored === "number") {
				// Back/forward (or a reload of a stamped entry): the entry tells us
				// exactly where we are.
				position.value = stored;
				maxIndex.value = Math.max(maxIndex.value, stored);
			} else {
				// A fresh push lands on an unstamped entry: advance, stamp it, and
				// truncate the forward tail (this branch replaces anything ahead).
				position.value += 1;
				maxIndex.value = position.value;
				stampIndex(position.value);
			}
			recompute();
		});

		recompute();
	}

	return {
		canBack: readonly(canBack),
		canForward: readonly(canForward),
		back: () => router.back(),
		forward: () => router.forward(),
		install,
	};
}
