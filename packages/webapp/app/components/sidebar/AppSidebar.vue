<script setup lang="ts">
import { ref } from "vue";
import type { SidebarProps } from "@/components/ui/sidebar";
import {
  Puzzle,
  Settings,
  Users,
  CreditCard,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
  BarChart3,
  MessagesSquare,
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  FileSearch,
  Compass,
} from "lucide-vue-next";
import NavMain from "@/components/sidebar/NavMain.vue";
import NavUser from "@/components/sidebar/NavUser.vue";
import WorkspaceSwitcher from "@/components/sidebar/WorkspaceSwitcher.vue";
import HelpChat from "@/components/help/HelpChat.vue";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
});

const { state } = useSidebar();
const helpChatRef = ref();

// Get authenticated user data
const { user } = useAuth();

const userData = computed(() => ({
  name: user.value?.name || "Guest",
  email: user.value?.email || "",
  avatar: "",
}));

// Sample data
const data = {
  workspaces: [
    {
      name: "Production App",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Staging",
      logo: AudioWaveform,
      plan: "Pro",
    },
    {
      name: "Development",
      logo: Command,
      plan: "Free",
    },
  ],
  navDashboard: {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  navWorkspace: [
    {
      title: "Files",
      url: "/files",
      icon: FolderOpen,
      isActive: false,
    },
    {
      title: "Knowledge",
      url: "/knowledge",
      icon: Sparkles,
      isActive: false,
    },
    {
      title: "Team",
      url: "/team",
      icon: Users,
      isActive: false,
    },
  ],
  navAutomation: [
    {
      title: "Integrations",
      url: "/integrations",
      icon: Puzzle,
      isActive: false,
    },
    {
      title: "Explore",
      url: "/integrations/explore",
      icon: Compass,
      isActive: false,
    },
  ],
  navObservability: [
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
      isActive: false,
    },
    {
      title: "Logs",
      url: "/analytics/logs",
      icon: FileSearch,
      isActive: false,
    },
  ],
};

function openHelpChat() {
  helpChatRef.value?.toggleChat();
}
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <WorkspaceSwitcher :workspaces="data.workspaces" />
    </SidebarHeader>
    <SidebarContent>
      <!-- Overview - hidden when sidebar is collapsed -->
      <SidebarMenu v-if="state === 'expanded'" class="px-2 pt-2">
        <SidebarMenuItem>
          <SidebarMenuButton as-child>
            <NuxtLink to="/">
              <LayoutDashboard />
              <span>Overview</span>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <NavMain :items="data.navWorkspace" label="Workspace" />
      <NavMain :items="data.navAutomation" label="Automation" />
      <NavMain :items="data.navObservability" label="Observability" />
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton as-child>
            <NuxtLink to="/billing">
              <CreditCard />
              <span>Billing</span>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton as-child>
            <NuxtLink to="/settings">
              <Settings />
              <span>Settings</span>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton @click="openHelpChat">
            <MessagesSquare />
            <span>Support</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <NavUser :user="userData" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>

  <!-- Help Chat Popup -->
  <HelpChat ref="helpChatRef" />
</template>
