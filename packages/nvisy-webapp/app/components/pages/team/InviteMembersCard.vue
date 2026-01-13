<script setup lang="ts">
import type { InviteExpiration, WorkspaceRole } from "@nvisy/sdk/datatypes";
import { Copy, Check, ChevronDown, Loader2, Send } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  <Card
    class="mb-8 overflow-hidden py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
  >
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle
            class="text-sm font-normal tracking-wider uppercase text-neutral-500 dark:text-neutral-400"
            >{{ t("members.forms.invite.title") }}</CardTitle
          >
          <CardDescription>{{
            t("members.forms.invite.description")
          }}</CardDescription>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="text-sm font-normal text-neutral-600 dark:text-neutral-400"
          >
            {{ t("members.forms.invite.expiry.label") }}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="outline"
                class="flex items-center gap-2 min-w-32 justify-between font-normal"
              >
                {{
                  inviteExpiryOptions.find((o) => o.value === selectedExpiry)
                    ?.label
                }}
                <ChevronDown :size="16" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                v-for="option in inviteExpiryOptions"
                :key="option.value"
                @click="selectedExpiry = option.value"
              >
                {{ option.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="w-32 justify-between font-normal">
                {{ roles.find((r) => r.value === selectedRole)?.label }}
                <ChevronDown :size="16" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                v-for="role in roles"
                :key="role.value"
                @click="selectedRole = role.value"
              >
                {{ role.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            @click="handleCopyLink"
            :disabled="isGenerating"
            class="flex items-center gap-2 font-normal"
          >
            <Loader2 v-if="isGenerating" :size="16" class="animate-spin" />
            <Check
              v-else-if="copiedInviteLink"
              :size="16"
              class="text-green-500"
            />
            <Copy v-else :size="16" />
            {{ t("members.forms.invite.createLink") }}
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div class="flex gap-3">
        <Input
          v-model="inviteEmail"
          type="email"
          :placeholder="t('members.forms.invite.emailPlaceholder')"
          class="flex-1 font-normal"
          @keyup.enter="handleSendInvite"
        />
        <Button
          @click="handleSendInvite"
          :disabled="!inviteEmail.trim() || isSending"
          class="font-normal"
        >
          <Loader2 v-if="isSending" :size="16" class="animate-spin" />
          <Check v-else-if="inviteSent" :size="16" class="text-green-500" />
          <Send v-else :size="16" />
          {{ t("members.forms.invite.button") }}
        </Button>
      </div>
    </CardContent>
    <CardFooter
      class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
    >
      <p class="text-sm font-normal text-neutral-600 dark:text-neutral-400">
        {{ t("members.messages.inviteFooter") }}
      </p>
    </CardFooter>
  </Card>
</template>
