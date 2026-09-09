<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import { AvatarUploadCard } from "#console/components/avatar";
import { PasswordInput } from "#console/components/shared";
import { personLabel } from "#console/utils/naming";
import { Card, CardContent, CardFooter } from "#console/components/ui/card";
import { HeaderSocket, SectionTabs } from "#console/components/layout/header";
import SignInMethodsCard from "#console/components/pages/account/SignInMethodsCard.vue";
import type { IdentityProvider } from "@nvisy/sdk/datatypes";
import { toast } from "vue-sonner";

useHead({ title: "Account" });

definePageMeta({
	pageCategory: "header.category.settings",
	hideCategory: true,
});

const { t } = useI18n();
const sectionTabs = useSectionTabs();

const {
	account,
	displayName: accountDisplayName,
	username: accountUsername,
	emailAddress,
	avatarUrl: accountAvatarUrl,
	isLoading,
	updateAccountAsync,
	isUpdating,
	setPasswordAsync,
	removePasswordAsync,
	isRemovingPassword,
	uploadAvatarAsync,
	isUploadingAvatar,
	deleteAvatarAsync,
	isDeletingAvatar,
} = useAccount();
const { resolveAvatarUrl } = useAvatarUrl();

const {
	identities,
	hasPassword,
	availableProviders,
	canLink,
	isLoading: isLoadingIdentities,
	refresh: refreshIdentities,
	startLink,
	startSetPassword,
	unlinkAsync,
	handleReturn,
} = useAccountIdentities();

// Username: lowercase alphanumeric with single internal dashes (matches signup).
const USERNAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Avatar placeholder must match the sidebar (NavUser) exactly — same person
// fallback (display name → username → email) so both show identical initials
// and gradient color (the gradient is hashed from this string).
const avatarLabel = computed(() =>
	personLabel({
		displayName: accountDisplayName.value,
		username: accountUsername.value,
		emailAddress: emailAddress.value,
	}),
);

// Resolved avatar image URL for display (undefined when unset).
const avatarSrc = computed(() => resolveAvatarUrl(accountAvatarUrl.value));

// Local object-URL shown for instant feedback while an upload is in flight;
// cleared once the refreshed account carries the server-side avatarUrl.
const previewUrl = ref("");
const displayImage = computed(() => previewUrl.value || avatarSrc.value);

// Profile form
const displayName = ref("");
const username = ref("");
const email = ref("");

const usernameError = computed(() => {
	const value = username.value.trim();
	if (!value) return t("account.profile.usernameRequired");
	return USERNAME_PATTERN.test(value)
		? ""
		: t("account.profile.usernameInvalid");
});

// Password form
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const isUpdatingPassword = ref(false);

// A failed action's toast: the title key plus the error's own message (falling
// back to a generic retry line) as the description. Collapses the repeated
// catch-block shape across the account actions.
function toastError(titleKey: string, err: unknown) {
	toast.error(t(titleKey), {
		description: getErrorMessage(err, t("common.errors.tryAgain")),
	});
}

// Sign-in methods: the provider mid-action (spinner/disable), a proof captured
// from a reauth return (unlocks the set-first-password form), and whether the
// set-first-password form is showing.
const busyProvider = ref<IdentityProvider | null>(null);
const firstPasswordProof = ref<string | null>(null);
const showFirstPasswordForm = computed(() => firstPasswordProof.value !== null);

async function handleLinkProvider(provider: OidcProvider) {
	busyProvider.value = provider;
	try {
		await startLink(provider); // redirects; may not return here
	} catch {
		busyProvider.value = null;
		toast.error(t("account.identities.linkFailed"));
	}
}

async function handleUnlinkProvider(provider: IdentityProvider) {
	busyProvider.value = provider;
	try {
		await unlinkAsync(provider);
		toast.success(t("account.identities.unlinked"));
	} catch (err) {
		toastError("account.identities.unlinkFailed", err);
	} finally {
		busyProvider.value = null;
	}
}

// Start setting a first password (OIDC-only account): step up first, then the
// return handler reveals the form. Redirects, so may not return here.
async function beginSetFirstPassword() {
	try {
		await startSetPassword();
	} catch {
		toast.error(t("account.password.reauthFailed"));
	}
}

async function removePassword() {
	try {
		await removePasswordAsync();
		toast.success(t("account.password.removed"));
		refreshIdentities();
	} catch (err) {
		toastError("account.password.removeFailed", err);
	}
}

// On return from a reauth/link redirect, resume the pending action.
onMounted(async () => {
	const route = useRoute();
	const hasReturn =
		window.location.hash.includes("reauthProof") || route.query.signin;

	const signin =
		typeof route.query.signin === "string" ? route.query.signin : null;
	// Always run: on a plain load (no return params) this clears any stale
	// pending reauth intent so a later fragment can't resume an abandoned flow.
	const result = await handleReturn(window.location.hash, signin);

	// Only rewrite the URL when there were return params to strip.
	if (hasReturn) history.replaceState(null, "", window.location.pathname);

	if (result.type === "linked") {
		toast.success(t("account.identities.linked"));
	} else if (result.type === "link-error") {
		toast.error(t("account.identities.linkFailed"));
	} else if (result.type === "await-password") {
		// Step-up done: reveal the set-first-password form, carrying the proof.
		firstPasswordProof.value = result.proof;
		newPassword.value = "";
		confirmPassword.value = "";
	}
});

// Seed the profile form from account data once. `account` refetches on side
// effects (e.g. an avatar upload); re-seeding would revert fields the user is
// still editing, so only fill the form the first time it loads.
let formSeeded = false;
watch(
	account,
	(acc) => {
		if (acc && !formSeeded) {
			formSeeded = true;
			displayName.value = acc.displayName || "";
			username.value = acc.username || "";
			email.value = acc.emailAddress || "";
		}
	},
	{ immediate: true },
);

function pickAvatar() {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = "image/*";
	input.onchange = (e) => {
		const file = (e.target as HTMLInputElement)?.files?.[0];
		if (file) uploadAvatar(file);
	};
	input.click();
}

async function uploadAvatar(file: File) {
	// Show the picked file immediately while the upload round-trips.
	previewUrl.value = URL.createObjectURL(file);
	try {
		await uploadAvatarAsync(file);
		toast.success(t("account.avatar.uploaded"));
	} catch (error) {
		toast.error(t("account.avatar.uploadFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	} finally {
		URL.revokeObjectURL(previewUrl.value);
		previewUrl.value = "";
	}
}

async function removeAvatar() {
	try {
		await deleteAvatarAsync();
		toast.success(t("account.avatar.removed"));
	} catch (error) {
		toast.error(t("account.avatar.removeFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}

async function saveProfile() {
	if (usernameError.value) return;
	try {
		await updateAccountAsync({
			displayName: displayName.value,
			username: username.value.trim(),
		});
		toast.success(t("account.profile.saved"));
	} catch (err) {
		toastError("account.profile.saveFailed", err);
	}
}

async function savePassword() {
	// Setting a first password (no existing one) carries the reauth proof from the
	// step-up; changing an existing one verifies the current password instead.
	const settingFirst = showFirstPasswordForm.value;

	if (!settingFirst && !currentPassword.value) {
		toast.error(t("account.password.currentRequired"));
		return;
	}
	if (!newPassword.value) {
		toast.error(t("account.password.required"));
		return;
	}
	if (newPassword.value.length < 8) {
		toast.error(t("account.password.tooShort"));
		return;
	}
	if (newPassword.value !== confirmPassword.value) {
		toast.error(t("account.password.mismatch"));
		return;
	}

	isUpdatingPassword.value = true;
	try {
		if (settingFirst) {
			await setPasswordAsync({
				newPassword: newPassword.value,
				reauthProof: firstPasswordProof.value ?? undefined,
			});
			firstPasswordProof.value = null;
			refreshIdentities();
		} else {
			// The API verifies `currentPassword` before applying `newPassword`.
			await setPasswordAsync({
				currentPassword: currentPassword.value,
				newPassword: newPassword.value,
			});
		}
		toast.success(t("account.password.saved"));
		currentPassword.value = "";
		newPassword.value = "";
		confirmPassword.value = "";
	} catch (err) {
		// A reauth proof is single-use: once a first-password attempt fails (e.g.
		// the proof expired), it can't be reused. Drop it so the form reverts to
		// the "Set a password" prompt rather than retrying with a dead proof.
		if (settingFirst) firstPasswordProof.value = null;
		toastError("account.password.saveFailed", err);
	} finally {
		isUpdatingPassword.value = false;
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="mx-auto w-full max-w-3xl">
      <!-- Section tabs in the app-header socket. -->
      <HeaderSocket>
        <SectionTabs :tabs="sectionTabs.account.value" />
      </HeaderSocket>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-muted-foreground" />
      </div>

      <div v-else class="space-y-6">
        <!-- Avatar Card -->
        <AvatarUploadCard
          :name="avatarLabel"
          :src="displayImage"
          :label="t('account.avatar.label')"
          :description="t('account.avatar.description')"
          :footer="t('account.avatar.footer')"
          :remove-label="t('account.avatar.remove')"
          :is-uploading="isUploadingAvatar"
          :is-deleting="isDeletingAvatar"
          @pick="pickAvatar"
          @remove="removeAvatar"
        />

        <!-- Profile Info Card -->
        <Card class="rounded-xl border-border/50 py-0 pt-6">
          <CardContent class="space-y-5">
            <!-- Display Name -->
            <div class="space-y-2">
              <Label for="displayName" required>
                {{ t("account.profile.nameLabel") }}
              </Label>
              <Input
                id="displayName"
                v-model="displayName"
                :placeholder="t('account.profile.namePlaceholder')"
                class="h-9 max-w-md"
              />
              <p class="text-xs text-muted-foreground">
                {{ t("account.profile.nameHint") }}
              </p>
            </div>

            <!-- Username -->
            <div class="space-y-2">
              <Label for="username" required>
                {{ t("account.profile.usernameLabel") }}
              </Label>
              <Input
                id="username"
                v-model="username"
                :placeholder="t('account.profile.usernamePlaceholder')"
                class="h-9 max-w-md"
                autocapitalize="none"
                autocomplete="username"
                :aria-invalid="!!usernameError"
              />
              <p v-if="usernameError" class="text-xs text-destructive">
                {{ usernameError }}
              </p>
              <p v-else class="text-xs text-muted-foreground">
                {{ t("account.profile.usernameHint") }}
              </p>
            </div>
          </CardContent>
          <CardFooter
            class="flex items-center justify-between rounded-b-xl border-t border-border/50 bg-muted/30 pb-6"
          >
            <p class="text-xs text-muted-foreground">
              {{ t("account.profile.footer") }}
            </p>
            <Button size="sm" @click="saveProfile" :disabled="isUpdating">
              <Loader2 v-if="isUpdating" :size="16" class="mr-2 animate-spin" />
              {{ t("common.save") }}
            </Button>
          </CardFooter>
        </Card>

        <!-- Email & Password Card -->
        <Card class="rounded-xl border-border/50 py-0 pt-6">
          <!-- No footer in the set-a-password state (no existing password, form
               not yet revealed), so the content needs its own bottom padding —
               otherwise the "Set a password" button clips the card's edge. -->
          <CardContent
            class="space-y-5"
            :class="!hasPassword && !showFirstPasswordForm && 'pb-6'"
          >
            <!-- Email Address (read-only) -->
            <div class="space-y-2">
              <Label for="email" required>
                {{ t("account.email.label") }}
              </Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                readonly
                class="h-9 max-w-md bg-muted/50 text-muted-foreground"
              />
              <p class="text-xs text-muted-foreground">
                {{ t("account.email.hint") }}
              </p>
            </div>

            <!-- Password -->
            <div class="space-y-4 border-t border-border/50 pt-5">
              <!-- No password (OIDC-only) and not yet stepped up: prompt to set
                   one. Setting a first password needs a fresh re-auth, so this
                   redirects to the provider first, then reveals the form. -->
              <template v-if="!hasPassword && !showFirstPasswordForm">
                <div class="flex items-center justify-between gap-4">
                  <div class="space-y-1">
                    <Label>{{ t("account.password.label") }}</Label>
                    <p class="text-xs text-muted-foreground">
                      {{ t("account.password.noneHint") }}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    class="shrink-0"
                    :disabled="!canLink"
                    :title="
                      canLink
                        ? undefined
                        : t('account.password.reauthNeedsProvider')
                    "
                    @click="beginSetFirstPassword"
                  >
                    {{ t("account.password.setButton") }}
                  </Button>
                </div>
              </template>

              <!-- Change existing password (needs the current one). -->
              <template v-else-if="hasPassword">
                <div class="space-y-2">
                  <Label for="currentPassword" required>
                    {{ t("account.password.currentLabel") }}
                  </Label>
                  <PasswordInput
                    id="currentPassword"
                    v-model="currentPassword"
                    :placeholder="t('account.password.currentPlaceholder')"
                    autocomplete="current-password"
                  />
                </div>

                <div class="space-y-2">
                  <Label for="newPassword" required>
                    {{ t("account.password.newLabel") }}
                  </Label>
                  <PasswordInput
                    id="newPassword"
                    v-model="newPassword"
                    :placeholder="t('account.password.newPlaceholder')"
                    autocomplete="new-password"
                  />
                  <p class="text-xs text-muted-foreground">
                    {{ t("account.password.newHint") }}
                  </p>
                </div>

                <div class="space-y-2">
                  <Label for="confirmPassword" required>
                    {{ t("account.password.confirmLabel") }}
                  </Label>
                  <PasswordInput
                    id="confirmPassword"
                    v-model="confirmPassword"
                    :placeholder="t('account.password.confirmPlaceholder')"
                    autocomplete="new-password"
                  />
                </div>
              </template>

              <!-- Set a first password after a completed re-auth (no current
                   password to enter). -->
              <template v-else>
                <div class="space-y-2">
                  <Label for="newPassword" required>
                    {{ t("account.password.newLabel") }}
                  </Label>
                  <PasswordInput
                    id="newPassword"
                    v-model="newPassword"
                    :placeholder="t('account.password.newPlaceholder')"
                    autocomplete="new-password"
                  />
                  <p class="text-xs text-muted-foreground">
                    {{ t("account.password.newHint") }}
                  </p>
                </div>

                <div class="space-y-2">
                  <Label for="confirmPassword" required>
                    {{ t("account.password.confirmLabel") }}
                  </Label>
                  <PasswordInput
                    id="confirmPassword"
                    v-model="confirmPassword"
                    :placeholder="t('account.password.confirmPlaceholder')"
                    autocomplete="new-password"
                  />
                </div>
              </template>
            </div>
          </CardContent>
          <CardFooter
            v-if="hasPassword || showFirstPasswordForm"
            class="flex items-center justify-between rounded-b-xl border-t border-border/50 bg-muted/30 pb-6"
          >
            <!-- Remove-password only when it isn't the account's only method. -->
            <Button
              v-if="hasPassword && identities.length > 1"
              variant="ghost"
              size="sm"
              class="text-muted-foreground hover:text-destructive"
              :disabled="isRemovingPassword"
              @click="removePassword"
            >
              <Loader2
                v-if="isRemovingPassword"
                :size="16"
                class="mr-2 animate-spin"
              />
              {{ t("account.password.remove") }}
            </Button>
            <p v-else class="text-xs text-muted-foreground">
              {{ t("account.password.footer") }}
            </p>
            <Button
              size="sm"
              @click="savePassword"
              :disabled="isUpdatingPassword || !newPassword"
            >
              <Loader2
                v-if="isUpdatingPassword"
                :size="16"
                class="mr-2 animate-spin"
              />
              {{ t("account.password.button") }}
            </Button>
          </CardFooter>
        </Card>

        <!-- Sign-in methods (connected providers) -->
        <SignInMethodsCard
          :identities="identities"
          :available-providers="availableProviders"
          :can-link="canLink"
          :busy-provider="busyProvider"
          :is-loading="isLoadingIdentities"
          @link="handleLinkProvider"
          @unlink="handleUnlinkProvider"
        />
      </div>
    </div>
  </div>
</template>
