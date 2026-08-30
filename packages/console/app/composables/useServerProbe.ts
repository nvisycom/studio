import { NvisyApiError } from "@nvisy/sdk";
import type { Health } from "@nvisy/sdk/datatypes";
import { checkHealth } from "@nvisy/sdk/standalone";
import { normalize } from "#console/composables/useApiBaseUrl";

/**
 * Result of a pre-flight server check — a reachability probe against a candidate
 * server URL, run *before* login so "can I reach this server?" is answered
 * separately from "are my credentials right?". The two collapse into one useless
 * message today (a failed login), which this splits apart.
 *
 * - `idle` — no check has run for the current input.
 * - `checking` — a probe is in flight.
 * - `reachable` — the URL answered the health endpoint; `status` is the server's
 *   own health level, so a degraded server still reads as reachable.
 * - `unreachable` — the request never got a response (server down, wrong port,
 *   wrong host, network). The most common self-hosted first-run failure.
 * - `invalid` — the entered text isn't a usable http(s) URL.
 * - `not-nvisy` — something answered, but not as an Nvisy server (a different
 *   service on that address, a proxy, a captive page).
 */
export type ProbeResult =
	| { kind: "idle" }
	| { kind: "checking" }
	| { kind: "reachable"; status: Health["status"] }
	| { kind: "unreachable" }
	| { kind: "invalid" }
	| { kind: "not-nvisy" };

/**
 * Probe a candidate server URL for reachability, independent of the live SDK
 * client and of any committed override. Uses the SDK's standalone `checkHealth`
 * — the health endpoint is public, so it needs no token, and the SDK owns the
 * route — with the injected fetch (desktop: Tauri's native fetch, which bypasses
 * the webview CORS the same way login does). A user can thus verify a self-hosted
 * server before committing to it.
 *
 * One probe supersedes the last: a stale in-flight check can't overwrite a newer
 * result, and clearing the input resets to `idle`.
 */
export function useServerProbe() {
	const { apiFetch } = useApiFetch();

	const result = ref<ProbeResult>({ kind: "idle" });
	// Supersede token: bumped per probe so a slow response for an old URL can't
	// land on top of a newer check.
	let token = 0;

	/** Reset to idle (e.g. the URL field was cleared or edited). */
	function reset() {
		token++;
		result.value = { kind: "idle" };
	}

	/**
	 * Run a probe against `url`. Normalizes first (so a schemeless `localhost:8080`
	 * resolves the same way the SDK will), then calls the SDK's health endpoint.
	 * Never throws — every failure maps to a {@link ProbeResult}.
	 */
	async function check(url: string): Promise<ProbeResult> {
		// Bump the supersede token first, so even an invalid URL invalidates any
		// earlier in-flight probe (whose late result would otherwise overwrite this).
		const mine = ++token;
		const base = normalize(url);
		if (!base) {
			result.value = { kind: "invalid" };
			return result.value;
		}
		result.value = { kind: "checking" };

		let next: ProbeResult;
		try {
			const health = await checkHealth({
				baseUrl: base,
				fetch: apiFetch.value,
			});
			next = { kind: "reachable", status: health.status };
		} catch (error) {
			// A response arrived but wasn't a healthy Nvisy reply (a 404, a proxy, some
			// other service on that address) surfaces as an API error. No response at
			// all — the fetch itself rejected — means the server is unreachable.
			next =
				error instanceof NvisyApiError
					? { kind: "not-nvisy" }
					: { kind: "unreachable" };
		}

		// Only publish if this is still the most recent probe.
		if (mine === token) result.value = next;
		return next;
	}

	return { result, check, reset };
}
