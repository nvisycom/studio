<script setup lang="ts">
import type { InviteExpiration, WorkspaceRole } from "@nvisy/sdk/datatypes";
import { Copy, Check, Loader2, Send } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";

const emit = defineEmits<{
	sendInvite: [email: string, role: WorkspaceRole, expiry: InviteExpiration];
	copyLink: [role: WorkspaceRole, expiry: InviteExpiration];
}>();

defineProps<{
	isSending: boolean;
	isGenerating: boolean;
	copiedInviteLink: boolean;
	inviteSent: boolean;
}>();

const { t } = useI18n();

const inviteEmail = ref("");
const selectedRole = ref<WorkspaceRole>("member");
const selectedExpiry = ref<InviteExpiration>("in7Days");

const roles = computed(() => [
	{ value: "owner" as WorkspaceRole, label: t("members.roles.owner") },
	{ value: "admin" as WorkspaceRole, label: t("members.roles.admin") },
	{ value: "member" as WorkspaceRole, label: t("members.roles.member") },
	{ value: "guest" as WorkspaceRole, label: t("members.roles.guest") },
]);

const inviteExpiryOptions = computed(() => [
	{
		label: t("members.forms.invite.expiry.24hours"),
		value: "in24Hours" as InviteExpiration,
	},
	{
		label: t("members.forms.invite.expiry.7days"),
		value: "in7Days" as InviteExpiration,
	},
	{
		label: t("members.forms.invite.expiry.30days"),
		value: "in30Days" as InviteExpiration,
	},
]);

function handleSendInvite() {
	if (!inviteEmail.value.trim()) return;
	emit(
		"sendInvite",
		inviteEmail.value,
		selectedRole.value,
		selectedExpiry.value,
	);
	inviteEmail.value = "";
	selectedRole.value = "member";
}

function handleCopyLink() {
	emit("copyLink", selectedRole.value, selectedExpiry.value);
}
</script>

<template>
  <Card class="mb-8 overflow-hidden rounded-xl border-border/50 py-0 pt-6">
    <CardHeader>
      <div class="flex items-start justify-between gap-4">
        <div>
          <CardTitle
            class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >{{ t("members.forms.invite.title") }}</CardTitle
          >
          <CardDescription class="text-sm">{{
            t("members.forms.invite.description")
          }}</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="handleCopyLink"
          :disabled="isGenerating"
          class="font-normal"
        >
          <Loader2 v-if="isGenerating" :size="16" class="animate-spin" />
          <Check v-else-if="copiedInviteLink" :size="16" class="text-green-500" />
          <Copy v-else :size="16" />
          {{ t("members.forms.invite.createLink") }}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div class="flex flex-wrap gap-3">
        <Input
          v-model="inviteEmail"
          type="email"
          :placeholder="t('members.forms.invite.emailPlaceholder')"
          class="min-w-[200px] flex-1"
          @keyup.enter="handleSendInvite"
        />
        <Select v-model="selectedRole">
          <SelectTrigger class="h-9 w-[140px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="role in roles"
              :key="role.value"
              :value="role.value"
              class="text-sm font-normal"
            >
              {{ role.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="selectedExpiry">
          <SelectTrigger class="h-9 w-[150px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in inviteExpiryOptions"
              :key="option.value"
              :value="option.value"
              class="text-sm font-normal"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          @click="handleSendInvite"
          :disabled="!inviteEmail.trim() || isSending"
        >
          <Loader2 v-if="isSending" :size="16" class="animate-spin" />
          <Check v-else-if="inviteSent" :size="16" class="text-green-500" />
          <Send v-else :size="16" />
          {{ t("members.forms.invite.button") }}
        </Button>
      </div>
    </CardContent>
    <CardFooter
      class="rounded-b-xl border-t border-border/50 bg-muted/30 pb-6"
    >
      <p class="text-xs text-muted-foreground">
        {{ t("members.messages.inviteFooter") }}
      </p>
    </CardFooter>
  </Card>
</template>
