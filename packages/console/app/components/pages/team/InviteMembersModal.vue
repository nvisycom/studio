<script setup lang="ts">
import type { InviteExpiration, WorkspaceRole } from "@nvisy/sdk/datatypes";
import { Check, Copy, Loader2, Send, X } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Label } from "#console/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";

/**
 * Invite people to the workspace. Two modes share one panel (and the same role
 * + expiry): invite by email (one or several, entered as chips), or generate a
 * join link that anyone can use. The link is surfaced here — role, expiry, and
 * the URL — rather than only landing on the clipboard.
 */
interface Props {
	open: boolean;
	isSending: boolean;
	isGenerating: boolean;
	/** The generated join URL, shown once "Generate link" resolves (else null). */
	generatedLink: string | null;
	/** Role/expiry the shown link was minted with, for its badge. */
	generatedRole: WorkspaceRole | null;
	generatedExpiry: InviteExpiration | null;
}

interface Emits {
	(e: "update:open", value: boolean): void;
	(
		e: "send",
		emails: string[],
		role: WorkspaceRole,
		expiry: InviteExpiration,
	): void;
	(e: "generate-link", role: WorkspaceRole, expiry: InviteExpiration): void;
	/** The parent performs the copy and reports whether it succeeded. */
	(e: "copy-link", onResult: (ok: boolean) => void): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n();

const role = ref<WorkspaceRole>("member");
const expiry = ref<InviteExpiration>("in7Days");
const draft = ref(""); // the in-progress email being typed
const emails = ref<string[]>([]);
const copied = ref(false);

const roleOptions: WorkspaceRole[] = ["owner", "admin", "member", "guest"];
const expiryOptions: InviteExpiration[] = ["in24Hours", "in7Days", "in30Days"];

// InviteExpiration values (`in7Days`) don't match the i18n label keys
// (`7days`), so map between them for both the full and short labels.
const EXPIRY_KEY: Record<InviteExpiration, string> = {
	in24Hours: "24hours",
	in7Days: "7days",
	in30Days: "30days",
};
const expiryLabel = (e: InviteExpiration) =>
	t(`members.forms.invite.expiry.${EXPIRY_KEY[e]}`);
const expiryShort = (e: InviteExpiration) =>
	t(`members.forms.invite.expiryShort.${EXPIRY_KEY[e]}`);

// Reset the form each time the modal opens, so a previous session's chips/link
// never linger.
watch(
	() => props.open,
	(open) => {
		if (open) {
			emails.value = [];
			draft.value = "";
			role.value = "member";
			expiry.value = "in7Days";
			copied.value = false;
		}
	},
);

// A pragmatic email check — enough to flag typos without rejecting valid but
// unusual addresses. The server is the source of truth.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (value: string) => EMAIL_RE.test(value);

const validEmails = computed(() => emails.value.filter(isValidEmail));
const invalidCount = computed(
	() => emails.value.length - validEmails.value.length,
);

// Commit whatever's in the draft (on Enter, comma, space, or blur). Splits on
// commas/whitespace so a pasted list of addresses lands as individual chips.
function commitDraft(): void {
	const parts = draft.value.split(/[\s,;]+/).filter(Boolean);
	for (const part of parts) {
		if (!emails.value.includes(part)) emails.value.push(part);
	}
	draft.value = "";
}

function onKeydown(event: KeyboardEvent): void {
	if (event.key === "Enter" || event.key === "," || event.key === " ") {
		event.preventDefault();
		commitDraft();
	} else if (event.key === "Backspace" && !draft.value && emails.value.length) {
		emails.value.pop();
	}
}

function removeEmail(index: number): void {
	emails.value.splice(index, 1);
}

const linkExpiryLabel = computed(() =>
	props.generatedExpiry ? expiryShort(props.generatedExpiry) : "",
);

// With no valid emails yet, show the plain "Send invites" rather than
// "Send 0 invites"; once there are emails, count them.
const sendLabel = computed(() =>
	validEmails.value.length
		? t("members.modals.invite.send", validEmails.value.length)
		: t("members.modals.invite.sendEmpty"),
);

function send(): void {
	commitDraft();
	if (!validEmails.value.length) return;
	emit("send", [...validEmails.value], role.value, expiry.value);
}

function generateLink(): void {
	emit("generate-link", role.value, expiry.value);
}

function copyLink(): void {
	if (!props.generatedLink) return;
	// Show the success check only once the parent confirms the copy succeeded —
	// the clipboard write can fail, and we shouldn't contradict the error toast.
	emit("copy-link", (ok) => {
		if (!ok) return;
		copied.value = true;
		setTimeout(() => {
			copied.value = false;
		}, 2000);
	});
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ t("members.modals.invite.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("members.modals.invite.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="min-w-0 space-y-5 py-4">
        <!-- Email chips -->
        <div>
          <Label class="mb-2 text-sm font-medium text-foreground">
            {{ t("members.modals.invite.emailsLabel") }}
          </Label>
          <div
            class="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0"
          >
            <span
              v-for="(email, i) in emails"
              :key="`${email}-${i}`"
              class="inline-flex items-center gap-1 rounded pl-2 pr-1 py-0.5 text-sm font-medium"
              :class="
                isValidEmail(email)
                  ? 'bg-muted text-foreground'
                  : 'bg-destructive/10 text-destructive'
              "
            >
              {{ email }}
              <button
                type="button"
                class="grid size-4 place-items-center rounded text-muted-foreground hover:bg-border hover:text-foreground"
                :aria-label="t('members.modals.invite.removeEmail', { email })"
                @click="removeEmail(i)"
              >
                <X :size="12" />
              </button>
            </span>
            <input
              v-model="draft"
              type="email"
              class="min-w-[8rem] flex-1 border-0 bg-transparent p-1 text-sm outline-none placeholder:text-muted-foreground"
              :placeholder="
                emails.length
                  ? ''
                  : t('members.modals.invite.emailsPlaceholder')
              "
              @keydown="onKeydown"
              @blur="commitDraft"
            />
          </div>
          <p class="mt-1.5 text-xs text-muted-foreground">
            {{ t("members.modals.invite.emailsHint") }}
          </p>
        </div>

        <!-- Shared role + expiry -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label class="mb-2 text-sm font-medium text-foreground">
              {{ t("members.modals.invite.roleLabel") }}
            </Label>
            <Select v-model="role">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="r in roleOptions" :key="r" :value="r">
                  {{ t(`members.roles.${r}`) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label class="mb-2 text-sm font-medium text-foreground">
              {{ t("members.modals.invite.expiryLabel") }}
            </Label>
            <Select v-model="expiry">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="e in expiryOptions" :key="e" :value="e">
                  {{ expiryLabel(e) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Link zone: same role/expiry, made visible -->
        <div class="border-t border-dashed border-border/60 pt-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-foreground">
                {{ t("members.modals.invite.linkTitle") }}
              </p>
              <p class="mt-0.5 text-xs text-muted-foreground">
                {{
                  t("members.modals.invite.linkHint", {
                    role: t(`members.roles.${role}`),
                    expiry: expiryShort(expiry),
                  })
                }}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="shrink-0 font-normal"
              :disabled="isGenerating"
              @click="generateLink"
            >
              <Loader2 v-if="isGenerating" :size="16" class="animate-spin" />
              {{ t("members.modals.invite.generateLink") }}
            </Button>
          </div>

          <!-- Surfaced link: URL + role/expiry badge + copy -->
          <div
            v-if="generatedLink"
            class="mt-3 flex items-center gap-2 rounded-md border border-border/60 bg-muted py-1.5 pl-3 pr-1.5"
          >
            <code
              class="min-w-0 flex-1 truncate font-mono text-xs text-foreground"
            >
              {{ generatedLink }}
            </code>
            <span class="shrink-0 text-[11px] text-muted-foreground">
              {{ generatedRole ? t(`members.roles.${generatedRole}`) : "" }}
              · {{ linkExpiryLabel }}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              class="shrink-0"
              :aria-label="t('members.table.actions.copyLink')"
              @click="copyLink"
            >
              <Check v-if="copied" :size="15" class="text-green-600" />
              <Copy v-else :size="15" />
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter class="items-center sm:justify-between">
        <span class="text-xs text-muted-foreground">
          <template v-if="validEmails.length || invalidCount">
            {{
              t("members.modals.invite.countValid", validEmails.length)
            }}<template v-if="invalidCount">
              ·
              {{
                t("members.modals.invite.countInvalid", invalidCount)
              }}</template>
          </template>
        </span>
        <div class="flex gap-2">
          <Button
            variant="ghost"
            :disabled="isSending"
            @click="emit('update:open', false)"
          >
            {{ t("common.cancel") }}
          </Button>
          <Button :disabled="!validEmails.length || isSending" @click="send">
            <Loader2 v-if="isSending" :size="16" class="animate-spin" />
            <Send v-else :size="16" />
            {{ sendLabel }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
