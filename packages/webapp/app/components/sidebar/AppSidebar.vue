<script setup lang="ts">
import { ref } from "vue";
import type { SidebarProps } from "@/components/ui/sidebar";
import {
	LayoutDashboard,
	FileText,
	Activity,
	Puzzle,
	Settings,
	HelpCircle,
	User,
	Users,
	Receipt,
	CreditCard,
	Key,
	Frame,
	PieChart,
	Map,
	GalleryVerticalEnd,
	AudioWaveform,
	Command,
	BookOpen,
	Code,
	MessageCircle,
	Github,
	ExternalLink,
	BarChart3,
	FileSearch,
	Upload,
	Download,
	Workflow,
	PlayCircle,
	Brain,
	MessagesSquare,
} from "lucide-vue-next";
import NavMain from "@/components/sidebar/NavMain.vue";
import NavProjects from "@/components/sidebar/NavProjects.vue";
import NavUser from "@/components/sidebar/NavUser.vue";
import ProjectSwitcher from "@/components/sidebar/ProjectSwitcher.vue";
import HelpChat from "@/components/help/HelpChat.vue";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarGroup,
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
	navGettingStarted: [
		{
			title: "Dashboard",
			url: "/",
			icon: LayoutDashboard,
			isActive: false,
		},
	],
	navMain: [
		{
			title: "Documents",
			url: "/documents",
			icon: FileText,
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
			title: "Pipelines",
			url: "/pipelines",
			icon: Workflow,
			isActive: false,
		},
		{
			title: "Integrations",
			url: "/integrations",
			icon: Puzzle,
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
	quickProjects: [
		{
			name: "contract_template.pdf",
			url: "/documents",
			icon: FileText,
		},
		{
			name: "employee_handbook.docx",
			url: "/documents",
			icon: FileText,
		},
		{
			name: "quarterly_report.xlsx",
			url: "/documents",
			icon: FileText,
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
      <SidebarGroup class="group-data-[collapsible=icon]:hidden">
        <SidebarMenu>
          <SidebarMenuItem
            v-for="item in data.navGettingStarted"
            :key="item.title"
          >
            <SidebarMenuButton as-child>
              <NuxtLink :to="item.url">
                <component :is="item.icon" />
                <span>{{ item.title }}</span>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <NavMain :items="data.navMain" label="Platform" />
      <NavMain :items="data.navAutomation" label="Automation" />
      <NavMain :items="data.navObservability" label="Observability" />
      <NavProjects :projects="data.quickProjects" />
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
