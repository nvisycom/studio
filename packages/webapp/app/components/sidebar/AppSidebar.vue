<script setup lang="ts">
import { ref } from "vue";
import type { SidebarProps } from "@/components/ui/sidebar";
import {
  FileText,
  Puzzle,
  Settings,
  Users,
  CreditCard,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
  BarChart3,
  FileSearch,
  Brain,
  MessagesSquare,
  Compass,
  PenTool,
} from "lucide-vue-next";
import NavMain from "@/components/sidebar/NavMain.vue";
import NavUser from "@/components/sidebar/NavUser.vue";
import ProjectSwitcher from "@/components/sidebar/ProjectSwitcher.vue";
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

const helpChatRef = ref();

// Sample data
const data = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    avatar: "",
  },
  projects: [
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
  navWorkspace: [
    {
      title: "Documents",
      url: "/",
      icon: FileText,
      isActive: false,
    },
    {
      title: "Studio",
      url: "/studio",
      icon: PenTool,
      isActive: false,
    },
    {
      title: "Knowledge",
      url: "/knowledge",
      icon: Brain,
      isActive: false,
    },
    {
      title: "Members",
      url: "/members",
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
      <ProjectSwitcher :projects="data.projects" />
    </SidebarHeader>
    <SidebarContent>
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
      <NavUser :user="data.user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>

  <!-- Help Chat Popup -->
  <HelpChat ref="helpChatRef" />
</template>
