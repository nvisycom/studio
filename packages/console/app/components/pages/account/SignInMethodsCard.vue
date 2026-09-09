<script setup lang="ts">
import type { AccountIdentity, IdentityProvider } from "@nvisy/sdk/datatypes";
import { KeyRound, Loader2, Plus, Unlink } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Card, CardContent, CardHeader } from "#console/components/ui/card";
import { Badge } from "#console/components/ui/badge";

const { t } = useI18n();
const { relativeTime } = useRelativeTime();

const props = defineProps<{
	identities: AccountIdentity[];
	/** OIDC providers not yet linked (offered as "Connect" rows). */
	availableProviders: OidcProvider[];
	/** Whether linking is possible (needs a linked provider to step up with). */
	canLink: boolean;
	/** The provider currently mid-action (spinner + disable), if any. */
	busyProvider: IdentityProvider | null;
	isLoading?: boolean;
}>();

const emit = defineEmits<{
	(e: "link", provider: OidcProvider): void;
	(e: "unlink", provider: IdentityProvider): void;
}>();

// Display metadata per provider. `password` is the built-in credential; the
// rest are OIDC brand marks served from the web app's public dir.
const PROVIDER_META: Record<
	IdentityProvider,
	{ label: string; icon: string | null }
> = {
	password: { label: "Password", icon: null },
	google: { label: "Google", icon: "/brands/google.png" },
	microsoft: { label: "Microsoft", icon: "/brands/microsoft.png" },
};

// Fall back to the raw provider name for a provider the server returns that this
// SDK version doesn't know, so an unknown identity never crashes the card.
const providerLabel = (p: IdentityProvider) => PROVIDER_META[p]?.label ?? p;
const providerIcon = (p: IdentityProvider) => PROVIDER_META[p]?.icon ?? null;

// Unlinking is refused server-side when it would leave no sign-in method. Mirror
// that on the client so the button is disabled (with a hint) rather than erroring:
// the last remaining method can't be removed.
const canUnlink = computed(() => props.identities.length > 1);
</script>

<template>
  <Card class="rounded-xl border-border/50 py-0 pt-6">
    <CardHeader class="px-6 pb-0">
      <div class="space-y-1">
        <h3 class="text-sm font-medium text-foreground">
          {{ t("account.identities.title") }}
        </h3>
        <p class="text-sm text-muted-foreground">
          {{ t("account.identities.description") }}
        </p>
      </div>
    </CardHeader>

    <CardContent class="space-y-2 px-6 pb-6">
      <div v-if="isLoading" class="flex justify-center py-6">
        <Loader2 :size="20" class="animate-spin text-muted-foreground" />
      </div>

      <template v-else>
        <!-- Linked methods -->
        <div
          v-for="identity in identities"
          :key="identity.provider"
          class="flex items-center gap-3 rounded-lg border border-border/60 p-3"
        >
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40"
          >
            <img
              v-if="providerIcon(identity.provider)"
              :src="providerIcon(identity.provider)!"
              :alt="providerLabel(identity.provider)"
              class="size-5 object-contain"
            />
            <KeyRound v-else :size="16" class="text-muted-foreground" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-foreground">
                {{ providerLabel(identity.provider) }}
              </p>
              <Badge variant="secondary" class="h-4 px-1.5 text-[10px]">
                {{ t("account.identities.connected") }}
              </Badge>
            </div>
            <p class="truncate text-xs text-muted-foreground">
              <template v-if="identity.providerEmail">
                {{ identity.providerEmail }} ·
              </template>
              {{
                t("account.identities.addedOn", {
                  when: relativeTime(identity.createdAt),
                })
              }}
            </p>
          </div>
          <!-- Password is managed in the section above, not unlinked here. -->
          <Button
            v-if="identity.provider !== 'password'"
            variant="ghost"
            size="sm"
            class="shrink-0 text-muted-foreground hover:text-destructive"
            :disabled="!canUnlink || busyProvider === identity.provider"
            :title="
              canUnlink ? undefined : t('account.identities.lastMethodHint')
            "
            @click="emit('unlink', identity.provider)"
          >
            <Loader2
              v-if="busyProvider === identity.provider"
              :size="14"
              class="animate-spin"
            />
            <Unlink v-else :size="14" />
            {{ t("account.identities.unlink") }}
          </Button>
        </div>

        <!-- Connectable (not-yet-linked) providers -->
        <div
          v-for="provider in availableProviders"
          :key="provider"
          class="flex items-center gap-3 rounded-lg border border-dashed border-border/60 p-3"
        >
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40"
          >
            <img
              :src="providerIcon(provider)!"
              :alt="providerLabel(provider)"
              class="size-5 object-contain opacity-70"
            />
          </div>
          <p class="min-w-0 flex-1 text-sm text-muted-foreground">
            {{ providerLabel(provider) }}
          </p>
          <Button
            variant="outline"
            size="sm"
            class="shrink-0"
            :disabled="!canLink || busyProvider === provider"
            :title="canLink ? undefined : t('account.identities.linkNeedsMethod')"
            @click="emit('link', provider)"
          >
            <Loader2
              v-if="busyProvider === provider"
              :size="14"
              class="animate-spin"
            />
            <Plus v-else :size="14" />
            {{ t("account.identities.connect") }}
          </Button>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
