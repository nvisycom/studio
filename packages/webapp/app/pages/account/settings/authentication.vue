<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Shield,
	Smartphone,
	Key,
	FileText,
	Plus,
	Trash2,
	Copy,
	Check,
	Eye,
	EyeOff,
	Calendar,
	ChevronDown,
} from "lucide-vue-next";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";

definePageMeta({
	breadcrumbs: [
		{ label: "[account]" },
		{
			label: "Settings",
			href: "/account/settings/general",
			dropdown: [
				{ label: "General", value: "/account/settings/general" },
				{ label: "Authentication", value: "/account/settings/authentication" },
			],
		},
		{ label: "Authentication" },
	],
});

interface Token {
	id: string;
	name: string;
	scope: string;
	permissions: string[];
	createdAt: Date;
	expiresAt: Date | null;
	lastUsed: Date | null;
	token: string;
}

// Token creation form
const tokenName = ref("");
const tokenScope = ref("My Project");
const tokenExpiration = ref("90"); // days
const tokenPermissions = ref({
	uploads: false,
	downloads: false,
	integrations: false,
});

// 2FA state
const is2FAEnabled = ref(false);

// Authenticator apps
const authenticatorApps = ref([
	{ id: "1", name: "Google Authenticator", addedDate: new Date("2024-01-15") },
]);

// Passkeys
const passkeys = ref([
	{
		id: "1",
		name: "MacBook Pro",
		addedDate: new Date("2024-01-10"),
		lastUsed: new Date("2024-01-20"),
	},
	{
		id: "2",
		name: "iPhone 13",
		addedDate: new Date("2024-01-12"),
		lastUsed: new Date("2024-01-19"),
	},
]);

// Recovery codes
const recoveryCodes = ref<string[]>([]);
const hasRecoveryCodes = ref(false);

// Existing tokens
const tokens = ref<Token[]>([
	{
		id: "1",
		name: "Production API",
		scope: "My Project",
		permissions: ["uploads", "downloads"],
		createdAt: new Date("2024-01-10"),
		expiresAt: new Date("2024-04-10"),
		lastUsed: new Date("2024-01-20"),
		token: "nvisy_1a2b3c4d5e6f7g8h9i0j",
	},
	{
		id: "2",
		name: "Development Token",
		scope: "Demo Project",
		permissions: ["uploads", "integrations"],
		createdAt: new Date("2024-01-15"),
		expiresAt: null,
		lastUsed: null,
		token: "nvisy_9z8y7x6w5v4u3t2s1r0q",
	},
]);

// Mock projects data
const projects = [
	{ id: "proj_1", name: "My Project" },
	{ id: "proj_2", name: "Demo Project" },
	{ id: "proj_3", name: "Test Project" },
];

const expirationOptions = [
	{ value: "30", label: "30 days" },
	{ value: "90", label: "90 days" },
	{ value: "180", label: "180 days" },
	{ value: "365", label: "1 year" },
	{ value: "never", label: "Never" },
];

// UI state
const isAddAuthenticatorDialogOpen = ref(false);
const isAddPasskeyDialogOpen = ref(false);
const newTokenGenerated = ref<string | null>(null);
const copiedTokenId = ref<string | null>(null);

// Computed
const isTokenFormValid = computed(() => {
	return (
		tokenName.value.trim().length > 0 &&
		tokenScope.value.length > 0 &&
		(tokenPermissions.value.uploads ||
			tokenPermissions.value.downloads ||
			tokenPermissions.value.integrations)
	);
});

// Functions
function createToken() {
	if (!isTokenFormValid.value) return;

	const newToken: Token = {
		id: Date.now().toString(),
		name: tokenName.value,
		scope: tokenScope.value,
		permissions: Object.entries(tokenPermissions.value)
			.filter(([_, enabled]) => enabled)
			.map(([key, _]) => key),
		createdAt: new Date(),
		expiresAt:
			tokenExpiration.value === "never"
				? null
				: new Date(
						Date.now() +
							Number.parseInt(tokenExpiration.value) * 24 * 60 * 60 * 1000,
					),
		lastUsed: null,
		token: `nvisy_${Math.random().toString(36).substring(2)}`,
	};

	tokens.value.push(newToken);
	newTokenGenerated.value = newToken.token;

	// Reset form
	tokenName.value = "";
	tokenScope.value = projects[0]?.name || "";
	tokenExpiration.value = "90";
	tokenPermissions.value = {
		uploads: false,
		downloads: false,
		integrations: false,
	};

	console.log("Created token:", newToken);
}

function deleteToken(tokenId: string) {
	tokens.value = tokens.value.filter((t) => t.id !== tokenId);
	console.log("Deleted token:", tokenId);
}

async function copyToken(token: string, tokenId: string) {
	try {
		await navigator.clipboard.writeText(token);
		copiedTokenId.value = tokenId;
		setTimeout(() => {
			copiedTokenId.value = null;
		}, 2000);
	} catch (err) {
		console.error("Failed to copy token:", err);
	}
}

function closeNewTokenDialog() {
	newTokenGenerated.value = null;
}

function toggle2FA() {
	is2FAEnabled.value = !is2FAEnabled.value;
	console.log("2FA toggled:", is2FAEnabled.value);
}

function addAuthenticator() {
	isAddAuthenticatorDialogOpen.value = true;
	// Implement authenticator setup flow
}

function addPasskey() {
	isAddPasskeyDialogOpen.value = true;
	// Implement passkey registration flow
}

function generateRecoveryCodes() {
	// Generate 10 random recovery codes
	recoveryCodes.value = Array.from({ length: 10 }, () =>
		Math.random().toString(36).substring(2, 10).toUpperCase(),
	);
	hasRecoveryCodes.value = true;
	console.log("Generated recovery codes");
}

function downloadRecoveryCodes() {
	const content = recoveryCodes.value.join("\n");
	const blob = new Blob([content], { type: "text/plain" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "recovery-codes.txt";
	a.click();
	URL.revokeObjectURL(url);
}

function formatDate(date: Date | null): string {
	if (!date) return "Never";
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function formatPermissions(permissions: string[]): string {
	return permissions
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join(", ");
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <div class="space-y-6 pb-6">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Authentication
          </h1>
          <p class="text-neutral-600 dark:text-neutral-400">
            Manage your API tokens and security settings
          </p>
        </div>

      <!-- Create Token Section -->
      <Card class="py-0 pt-6 rounded-xl" id="create-token">
        <CardHeader>
          <CardTitle>Create API Token</CardTitle>
          <CardDescription>Generate a new API token for programmatic access</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                Token Name
              </label>
              <Input
                v-model="tokenName"
                placeholder="e.g., Production API"
                class="max-w-md"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                Scope
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="w-full max-w-md justify-between">
                    {{ tokenScope }}
                    <ChevronDown :size="16" class="ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-full max-w-md">
                  <DropdownMenuItem
                    v-for="project in projects"
                    :key="project.id"
                    @click="tokenScope = project.name"
                  >
                    {{ project.name }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                Expiration
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="w-full max-w-md justify-between">
                    {{ expirationOptions.find((opt) => opt.value === tokenExpiration)?.label || "Select expiration" }}
                    <Calendar :size="16" class="ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-full max-w-md">
                  <DropdownMenuItem
                    v-for="option in expirationOptions"
                    :key="option.value"
                    @click="tokenExpiration = option.value"
                  >
                    {{ option.label }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-3">
                Permissions
              </label>
              <div class="space-y-3">
                <div class="flex items-center space-x-2">
                  <Checkbox
                    :id="'perm-uploads'"
                    v-model:checked="tokenPermissions.uploads"
                  />
                  <label
                    :for="'perm-uploads'"
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Uploads
                  </label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    :id="'perm-downloads'"
                    v-model:checked="tokenPermissions.downloads"
                  />
                  <label
                    :for="'perm-downloads'"
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Downloads
                  </label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    :id="'perm-integrations'"
                    v-model:checked="tokenPermissions.integrations"
                  />
                  <label
                    :for="'perm-integrations'"
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Integrations
                  </label>
                </div>
              </div>
            </div>

            <Button
              @click="createToken"
              :disabled="!isTokenFormValid"
              class="flex items-center gap-2"
            >
              <Plus :size="16" />
              Create Token
            </Button>
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            API tokens provide programmatic access to your projects. Keep them secure and never share them publicly.
          </p>
        </CardFooter>
      </Card>

      <!-- Existing Tokens -->
      <Card class="py-0 pt-6 rounded-xl" id="existing-tokens">
        <CardHeader>
          <CardTitle>Active Tokens</CardTitle>
          <CardDescription>Manage your existing API tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="tokens.length > 0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead class="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="token in tokens"
                  :key="token.id"
                  class="hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <TableCell>
                    <p class="font-medium text-neutral-900 dark:text-white">
                      {{ token.name }}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" class="text-xs">
                      {{ token.scope }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span class="text-xs text-neutral-600 dark:text-neutral-400">
                      {{ formatPermissions(token.permissions) }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span class="text-xs text-neutral-600 dark:text-neutral-400">
                      {{ formatDate(token.expiresAt) }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span class="text-xs text-neutral-600 dark:text-neutral-400">
                      {{ formatDate(token.lastUsed) }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      @click="deleteToken(token.id)"
                      variant="ghost"
                      size="sm"
                      class="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 :size="14" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <Empty v-else>
            <EmptyHeader>
              <EmptyTitle>No tokens created</EmptyTitle>
              <EmptyDescription>
                Create your first API token to get started with programmatic access
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Tokens provide access to your account. Delete unused tokens to maintain security.
          </p>
        </CardFooter>
      </Card>

      <!-- Two-Factor Authentication -->
      <Card class="py-0 pt-6 rounded-xl" id="two-factor-auth">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                Enable two-factor authentication for enhanced security
              </p>
            </div>
            <Switch v-model:checked="is2FAEnabled" @update:checked="toggle2FA" />
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Two-factor authentication significantly improves your account security.
          </p>
        </CardFooter>
      </Card>

      <!-- Authenticator App (TOTP) -->
      <Card class="py-0 pt-6 rounded-xl" id="authenticator-app">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Authenticator App (TOTP)</CardTitle>
              <CardDescription>Use an authenticator app for two-factor authentication</CardDescription>
            </div>
            <Button @click="addAuthenticator" size="sm" class="flex items-center gap-2">
              <Plus :size="16" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="authenticatorApps.length > 0" class="space-y-2">
            <div
              v-for="app in authenticatorApps"
              :key="app.id"
              class="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <Smartphone :size="16" class="text-neutral-400" />
                <div>
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">
                    {{ app.name }}
                  </p>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400">
                    Added {{ formatDate(app.addedDate) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            We recommend using apps like Google Authenticator, Authy, or 1Password.
          </p>
        </CardFooter>
      </Card>

      <!-- Passkeys -->
      <Card class="py-0 pt-6 rounded-xl" id="passkeys">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Passkeys</CardTitle>
              <CardDescription>Use biometric authentication for passwordless sign-in</CardDescription>
            </div>
            <Button @click="addPasskey" size="sm" class="flex items-center gap-2">
              <Plus :size="16" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="passkeys.length > 0" class="space-y-2">
            <div
              v-for="passkey in passkeys"
              :key="passkey.id"
              class="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <Key :size="16" class="text-neutral-400" />
                <div>
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">
                    {{ passkey.name }}
                  </p>
                  <p class="text-xs text-neutral-600 dark:text-neutral-400">
                    Last used {{ formatDate(passkey.lastUsed) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Passkeys provide secure, passwordless authentication using your device's biometrics.
          </p>
        </CardFooter>
      </Card>

      <!-- Recovery Codes -->
      <Card class="py-0 pt-6 rounded-xl" id="recovery-codes">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Recovery Codes</CardTitle>
              <CardDescription>Generate backup codes for account recovery</CardDescription>
            </div>
            <Button
              @click="generateRecoveryCodes"
              size="sm"
              :variant="hasRecoveryCodes ? 'outline' : 'default'"
            >
              {{ hasRecoveryCodes ? 'Regenerate' : 'Generate' }}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="hasRecoveryCodes" class="space-y-4">
            <div class="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
              <div class="grid grid-cols-2 gap-2">
                <code
                  v-for="(code, index) in recoveryCodes"
                  :key="index"
                  class="text-sm font-mono text-neutral-900 dark:text-white"
                >
                  {{ code }}
                </code>
              </div>
            </div>
            <Button
              @click="downloadRecoveryCodes"
              variant="outline"
              size="sm"
              class="flex items-center gap-2"
            >
              <FileText :size="16" />
              Download Codes
            </Button>
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-amber-50 dark:bg-amber-950 rounded-b-xl">
          <p class="text-sm text-amber-600 dark:text-amber-400">
            Save these codes in a secure location. Each code can only be used once.
          </p>
        </CardFooter>
      </Card>

      <!-- New Token Dialog -->
      <Dialog :open="!!newTokenGenerated" @update:open="closeNewTokenDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Token Created Successfully</DialogTitle>
            <DialogDescription>
              Copy your token now. For security reasons, it won't be shown again.
            </DialogDescription>
          </DialogHeader>

          <div class="py-4">
            <div class="flex items-center gap-2">
              <Input
                :value="newTokenGenerated"
                readonly
                class="font-mono text-sm"
              />
              <Button
                @click="copyToken(newTokenGenerated!, 'new')"
                variant="outline"
                size="sm"
              >
                <Check v-if="copiedTokenId === 'new'" :size="16" class="text-green-600" />
                <Copy v-else :size="16" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button @click="closeNewTokenDialog">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  </div>
</template>
