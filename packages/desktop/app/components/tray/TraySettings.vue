<template>
  <div class="flex flex-col h-full animate-in fade-in duration-200">
    <!-- Account Card with Logout (outside accordion) -->
    <div class="flex items-center space-x-3 p-3 mb-4 rounded-lg bg-muted/30">
      <Avatar class="h-10 w-10">
        <AvatarImage :src="user.avatar" :alt="user.name" />
        <AvatarFallback class="text-sm">{{ getInitials(user.name) }}</AvatarFallback>
      </Avatar>
      <div class="flex-1 min-w-0">
        <p class="text-sm truncate">{{ user.name }}</p>
        <p class="text-xs text-muted-foreground truncate">{{ user.email }}</p>
      </div>
      <Button variant="outline" size="sm" class="h-8 px-3" @click="handleLogout">
        <LogOut class="w-4 h-4 mr-2" />
        {{ $t('auth.logout') }}
      </Button>
    </div>

    <Accordion type="multiple" :default-value="['preferences']" class="w-full space-y-2">
      <!-- Preferences Section -->
      <AccordionItem value="preferences" class="border-b-0">
        <AccordionTrigger class="py-2 hover:no-underline [&>svg]:order-first [&>svg]:mr-2">
          <span class="text-sm font-light">{{ $t('settings.tabs.preferences') }}</span>
        </AccordionTrigger>
        <AccordionContent>
          <div class="space-y-3 pt-2 pb-1">
            <!-- Theme -->
            <div class="flex items-center justify-between">
              <span class="text-sm">{{ $t('settings.theme') }}</span>
              <ThemeToggle />
            </div>

            <!-- Language -->
            <div class="flex items-center justify-between">
              <span class="text-sm">{{ $t('settings.language') }}</span>
              <LanguageSwitcher />
            </div>

            <!-- Use Gradient -->
            <div class="flex items-center justify-between">
              <span class="text-sm">{{ $t('settings.useGradient') }}</span>
              <Switch
                :model-value="settings.useGradient"
                @update:model-value="(val: boolean) => setUseGradient(val)"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <!-- Storage Section (Local & Remote Folders) -->
      <AccordionItem value="storage" class="border-b-0">
        <AccordionTrigger class="py-2 hover:no-underline [&>svg]:order-first [&>svg]:mr-2">
          <span class="text-sm font-light">{{ $t('settings.tabs.storage') }}</span>
        </AccordionTrigger>
        <AccordionContent>
          <div class="space-y-4 pt-2 pb-1 px-1">
            <!-- Local Folders -->
            <div class="space-y-2">
              <h3 class="text-xs text-muted-foreground">{{ $t('settings.localFolders') }}</h3>
              <div class="space-y-1.5">
                <div
                  v-for="(folder, index) in localFolders"
                  :key="'local-' + index"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="localFolders[index]"
                    type="text"
                    :placeholder="$t('settings.folderPath')"
                    class="flex-1 h-8 px-3 text-xs bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                    @blur="saveLocalFolders"
                  />
                  <Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click="browseFolder('local', index)">
                    <FolderOpen class="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    @click="removeFolder('local', index)"
                  >
                    <X class="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" class="h-7 text-xs" @click="addFolder('local')">
                  <Plus class="w-3 h-3 mr-1" />
                  {{ $t('settings.addFolder') }}
                </Button>
              </div>
            </div>

            <!-- Remote Folder (single) -->
            <div class="space-y-2">
              <h3 class="text-xs text-muted-foreground">{{ $t('settings.remoteFolder') }}</h3>
              <div class="flex items-center gap-2">
                <input
                  v-model="remoteFolder"
                  type="text"
                  :placeholder="$t('settings.folderPath')"
                  class="flex-1 h-8 px-3 text-xs bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                  @blur="saveRemoteFolder"
                />
                <Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click="browseFolder('remote', 0)">
                  <FolderOpen class="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <!-- Billing Section -->
      <AccordionItem value="billing" class="border-b-0">
        <AccordionTrigger class="py-2 hover:no-underline [&>svg]:order-first [&>svg]:mr-2">
          <span class="text-sm font-light">{{ $t('settings.tabs.billing') }}</span>
        </AccordionTrigger>
        <AccordionContent>
          <div class="space-y-3 pt-2 pb-1">
            <!-- Credits -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-sm">{{ $t('settings.credits') }}</span>
                <span class="text-xs text-muted-foreground">1,250 / 5,000</span>
              </div>
              <Progress :model-value="25" class="h-1.5" />
            </div>

            <!-- Storage -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-sm">{{ $t('settings.storage') }}</span>
                <span class="text-xs text-muted-foreground">2.4 GB / 10 GB</span>
              </div>
              <Progress :model-value="24" class="h-1.5" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>

<script setup lang="ts">
import { useActiveTab } from "~/composables/useActiveTab";
import { useAuth } from "~/composables/useAuth";
import { useSettings } from "~/composables/useSettings";

const { logout } = useAuth();
const activeTab = useActiveTab();
const { settings, setUseGradient, setLocalFolders, setRemoteFolder } =
	useSettings();

// User data
const _user = ref({
	name: "John Doe",
	email: "john@example.com",
	avatar: "",
});

// Local folders - synced with settings
const localFolders = ref<string[]>([...settings.value.localFolders]);

// Remote folder - synced with settings
const remoteFolder = ref(settings.value.remoteFolder);

// Watch for settings changes to update local state
watch(
	() => settings.value.localFolders,
	(newVal) => {
		localFolders.value = [...newVal];
	},
	{ deep: true },
);

watch(
	() => settings.value.remoteFolder,
	(newVal) => {
		remoteFolder.value = newVal;
	},
);

const _handleLogout = () => {
	logout();
	activeTab.value = "files";
};

// Save functions
const saveLocalFolders = () => {
	setLocalFolders([...localFolders.value]);
};

const _saveRemoteFolder = () => {
	setRemoteFolder(remoteFolder.value);
};

// Folder management
const _addFolder = (type: "local" | "remote") => {
	if (type === "local") {
		localFolders.value.push("");
	}
};

const _removeFolder = (type: "local" | "remote", index: number) => {
	if (type === "local") {
		localFolders.value.splice(index, 1);
		saveLocalFolders();
	}
};

const _browseFolder = (type: "local" | "remote", index: number) => {
	console.log(`Browse ${type} folder for index:`, index);
	// TODO: Implement Tauri folder picker
};
</script>
