import type { AccountIdentities, IdentityProvider } from "@nvisy/sdk/datatypes";

/** An OIDC sign-in provider: any identity provider except the built-in password. */
export type OidcProvider = Exclude<IdentityProvider, "password">;

// A pending credential action stashed across the reauth redirect. Reauth is an
// OIDC round-trip (full navigation), so the intent must survive it; kept in
// sessionStorage (tab-scoped, cleared on completion). It never holds secrets:
// the first-password form is shown only AFTER reauth returns, so the password
// is entered and submitted post-redirect, never stashed.
type PendingAction =
	| { kind: "link"; provider: IdentityProvider }
	| { kind: "set-password" };

const PENDING_KEY = "account-reauth-pending";

/**
 * The OIDC providers a user can connect as sign-in methods (everything except
 * the built-in `password` identity), in display order.
 */
export const OIDC_PROVIDERS: OidcProvider[] = ["google", "microsoft"];

/**
 * Account sign-in identities: the list of linked methods (password + OIDC
 * providers) and the actions to manage them.
 *
 * Adding a credential (linking a provider, or setting a first password) requires
 * a fresh step-up proof from `reauth`, which is itself an OIDC redirect that
 * returns the proof in the URL fragment. This composable owns that orchestration:
 * it stashes the pending action, starts reauth, and - via `handleReturn`, called
 * on the account page - resumes the action when the browser comes back.
 */
export function useAccountIdentities() {
	const { $nvisyClient } = useNuxtApp();
	const { isAuthenticated } = useAuth();

	const query = useQuery<AccountIdentities>({
		key: () => ["account", "identities"],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.account.listIdentities();
		},
		enabled: () => isAuthenticated.value,
	});

	const identities = computed(() => query.data.value?.identities ?? []);
	const hasPassword = computed(() =>
		identities.value.some((i) => i.provider === "password"),
	);
	const linkedProviders = computed<OidcProvider[]>(() =>
		identities.value
			.map((i) => i.provider)
			.filter((p): p is OidcProvider => p !== "password"),
	);
	// A linked provider to step up with (reauth needs an already-linked one).
	const reauthProvider = computed<IdentityProvider | null>(
		() => linkedProviders.value[0] ?? null,
	);

	// OIDC providers the account hasn't linked yet - offered as "Connect" rows.
	const availableProviders = computed(() =>
		OIDC_PROVIDERS.filter((p) => !linkedProviders.value.includes(p)),
	);

	// Adding a credential (link / first password) requires stepping up with an
	// already-linked provider; without one, those actions can't start.
	const canLink = computed(() => reauthProvider.value !== null);

	function requireClient() {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		return client;
	}

	const accountReturnUrl = () =>
		new URL("/account/general", window.location.origin).toString();

	function stashPending(action: PendingAction) {
		sessionStorage.setItem(PENDING_KEY, JSON.stringify(action));
	}
	function takePending(): PendingAction | null {
		const raw = sessionStorage.getItem(PENDING_KEY);
		if (!raw) return null;
		sessionStorage.removeItem(PENDING_KEY);
		try {
			return JSON.parse(raw) as PendingAction;
		} catch {
			return null;
		}
	}

	// Unlink an OIDC provider (server refuses the account's only method).
	const unlink = useMutation({
		mutation: async (provider: IdentityProvider) => {
			await requireClient().account.unlinkIdentity(provider);
		},
		onSuccess() {
			query.refresh();
		},
	});

	// Stash the pending action, step up via an already-linked provider, and
	// redirect to its authorize URL. The return handler resumes with the minted
	// proof. Shared by both credential-adding flows below.
	async function beginStepUp(action: PendingAction) {
		const stepUp = reauthProvider.value;
		if (!stepUp) throw new Error("No linked provider to re-authenticate with");
		stashPending(action);
		const { authorizeUrl } = await requireClient().account.reauth(stepUp, {
			redirectUri: accountReturnUrl(),
		});
		window.location.href = authorizeUrl;
	}

	// Begin linking a provider. The return handler finishes the link with the
	// minted proof (a second redirect to the provider's consent screen).
	const startLink = (provider: IdentityProvider) =>
		beginStepUp({ kind: "link", provider });

	// Begin setting a first password. On return the caller shows the password
	// form (with the proof) - the password is never stashed across the redirect.
	const startSetPassword = () => beginStepUp({ kind: "set-password" });

	/**
	 * Handle the browser's return from a reauth/link redirect. Reads the URL for:
	 *  - `#reauthProof=` - a step-up completed. Resume the pending action: finish
	 *    a `link` (redirects again to the provider), or hand the proof back to the
	 *    caller so it can show the set-password form.
	 *  - `?signin=success|error` - a `link`'s second hop completed (or failed).
	 *
	 * Returns what the page should do next; the page strips the URL after.
	 */
	async function handleReturn(
		hash: string,
		signin: string | null,
	): Promise<
		| { type: "none" }
		| { type: "linked" }
		| { type: "link-error" }
		| { type: "await-password"; proof: string }
	> {
		const proof = new URLSearchParams(hash.replace(/^#/, "")).get(
			"reauthProof",
		);

		if (proof) {
			const pending = takePending();
			if (pending?.kind === "link") {
				// Second hop: link the new provider with the proof, then redirect to
				// its consent screen. The link callback returns `?signin=success`.
				const { authorizeUrl } = await requireClient().account.linkIdentity(
					pending.provider,
					{ reauthProof: proof, redirectUri: accountReturnUrl() },
				);
				window.location.href = authorizeUrl;
				return { type: "none" };
			}
			if (pending?.kind === "set-password") {
				// Hand the proof to the page, which shows the set-password form.
				return { type: "await-password", proof };
			}
			return { type: "none" };
		}

		if (signin === "success") {
			query.refresh();
			return { type: "linked" };
		}
		if (signin === "error") {
			takePending();
			return { type: "link-error" };
		}
		// A plain load with no return params: drop any stale pending intent so a
		// later reauth fragment can't resume an abandoned flow.
		takePending();
		return { type: "none" };
	}

	return {
		// State
		identities,
		hasPassword,
		linkedProviders,
		availableProviders,
		canLink,
		reauthProvider,
		isLoading: query.isLoading,
		error: query.error,
		refresh: query.refresh,

		// Actions
		startLink,
		startSetPassword,
		unlinkAsync: unlink.mutateAsync,
		isUnlinking: unlink.isLoading,
		handleReturn,
	};
}
