<script setup lang="ts">
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
} from "lucide-vue-next";
import NavMain from "@/components/sidebar/NavMain.vue";
import NavProjects from "@/components/sidebar/NavProjects.vue";
import NavUser from "@/components/sidebar/NavUser.vue";
import ProjectSwitcher from "@/components/sidebar/ProjectSwitcher.vue";
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
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const props = withDefaults(defineProps<SidebarProps>(), {
	collapsible: "icon",
});

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
	navDashboard: [
		{
			title: "Dashboard",
			url: "/",
			icon: LayoutDashboard,
			isActive: false,
		},
		{
			title: "Tokens",
			url: "/tokens",
			icon: Key,
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
		{
			title: "Members",
			url: "/members",
			icon: Users,
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
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <ProjectSwitcher :projects="data.projects" />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="data.navDashboard" label="" />
      <NavMain :items="data.navMain" label="Platform" />
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
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton>
                <HelpCircle />
                <span>Help</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" class="w-48">
              <DropdownMenuItem as-child>
                <a
                  href="https://docs.nvisy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center justify-between gap-2"
                >
                  <div class="flex items-center gap-2">
                    <BookOpen :size="16" />
                    <span>Documentation</span>
                  </div>
                  <ExternalLink :size="12" class="opacity-50" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem as-child>
                <a
                  href="https://docs.nvisy.com/api-reference"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center justify-between gap-2"
                >
                  <div class="flex items-center gap-2">
                    <Code :size="16" />
                    <span>API Reference</span>
                  </div>
                  <ExternalLink :size="12" class="opacity-50" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem as-child>
                <a
                  href="https://discord.gg/nvisy"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center justify-between gap-2"
                >
                  <div class="flex items-center gap-2">
                    <MessageCircle :size="16" />
                    <span>Discord</span>
                  </div>
                  <ExternalLink :size="12" class="opacity-50" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem as-child>
                <a
                  href="https://github.com/nvisy"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center justify-between gap-2"
                >
                  <div class="flex items-center gap-2">
                    <Github :size="16" />
                    <span>GitHub</span>
                  </div>
                  <ExternalLink :size="12" class="opacity-50" />
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <NavUser :user="data.user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
