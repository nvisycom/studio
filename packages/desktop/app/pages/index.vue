<template>
  <div class="h-full flex flex-col p-4 space-y-4">
    <!-- Welcome Section -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Welcome back</h1>
        <p class="text-sm text-muted-foreground">Continue working on your project</p>
      </div>
      <div class="flex items-center space-x-2">
        <Button variant="outline" size="sm">
          <Plus class="w-4 h-4 mr-2" />
          New File
        </Button>
        <Button size="sm">
          <Play class="w-4 h-4 mr-2" />
          Run Project
        </Button>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="flex-1 grid grid-cols-12 gap-4 min-h-0">
      <!-- Left Panel - Quick Actions -->
      <div class="col-span-3 space-y-4">
        <!-- Recent Files -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm flex items-center">
              <FileText class="w-4 h-4 mr-2" />
              Recent Files
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <div
              v-for="file in recentFiles"
              :key="file.id"
              class="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
            >
              <component :is="getFileIcon(file.type)" class="w-4 h-4 mr-3 text-muted-foreground" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ file.name }}</p>
                <p class="text-xs text-muted-foreground">{{ file.path }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Quick Actions -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <Button variant="ghost" class="w-full justify-start h-8" size="sm">
              <FolderPlus class="w-4 h-4 mr-2" />
              Create Folder
            </Button>
            <Button variant="ghost" class="w-full justify-start h-8" size="sm">
              <GitBranch class="w-4 h-4 mr-2" />
              New Branch
            </Button>
            <Button variant="ghost" class="w-full justify-start h-8" size="sm">
              <Terminal class="w-4 h-4 mr-2" />
              Open Terminal
            </Button>
            <Button variant="ghost" class="w-full justify-start h-8" size="sm">
              <Search class="w-4 h-4 mr-2" />
              Search Files
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Center Panel - Main Workspace -->
      <div class="col-span-6 space-y-4">
        <!-- Project Overview -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base flex items-center justify-between">
              <div class="flex items-center">
                <FolderOpen class="w-5 h-5 mr-2" />
                Project Overview
              </div>
              <Button variant="ghost" size="sm">
                <ExternalLink class="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground">Files</span>
                  <span class="text-sm font-medium">{{ projectStats.files }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground">Folders</span>
                  <span class="text-sm font-medium">{{ projectStats.folders }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground">Size</span>
                  <span class="text-sm font-medium">{{ projectStats.size }}</span>
                </div>
              </div>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground">Last Modified</span>
                  <span class="text-sm font-medium">{{ projectStats.lastModified }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground">Git Branch</span>
                  <span class="text-sm font-medium">{{ projectStats.branch }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground">Status</span>
                  <div class="flex items-center">
                    <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span class="text-sm font-medium">Clean</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- File Explorer Preview -->
        <Card class="flex-1">
          <CardHeader class="pb-3">
            <CardTitle class="text-base flex items-center justify-between">
              <div class="flex items-center">
                <Folder class="w-5 h-5 mr-2" />
                File Explorer
              </div>
              <div class="flex items-center space-x-1">
                <Button variant="ghost" size="sm">
                  <RefreshCw class="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal class="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-1 max-h-64 overflow-y-auto">
              <div
                v-for="item in fileTree"
                :key="item.id"
                class="flex items-center p-1.5 rounded hover:bg-accent cursor-pointer transition-colors"
                :style="{ paddingLeft: `${item.level * 16 + 6}px` }"
              >
                <component :is="item.type === 'folder' ? Folder : getFileIcon(item.extension)"
                  class="w-4 h-4 mr-2 text-muted-foreground"
                />
                <span class="text-sm">{{ item.name }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Right Panel - Activity & Tools -->
      <div class="col-span-3 space-y-4">
        <!-- Activity Log -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm flex items-center">
              <Activity class="w-4 h-4 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="flex items-start space-x-2"
            >
              <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div class="space-y-1 min-w-0">
                <p class="text-xs font-medium">{{ activity.action }}</p>
                <p class="text-xs text-muted-foreground">{{ activity.timestamp }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Tools -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm">Development Tools</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" class="h-16 flex-col">
                <Database class="w-5 h-5 mb-1" />
                <span class="text-xs">Database</span>
              </Button>
              <Button variant="outline" size="sm" class="h-16 flex-col">
                <Code class="w-5 h-5 mb-1" />
                <span class="text-xs">Editor</span>
              </Button>
              <Button variant="outline" size="sm" class="h-16 flex-col">
                <Globe class="w-5 h-5 mb-1" />
                <span class="text-xs">Preview</span>
              </Button>
              <Button variant="outline" size="sm" class="h-16 flex-col">
                <Package class="w-5 h-5 mb-1" />
                <span class="text-xs">Build</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- System Info -->
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-sm flex items-center">
              <Monitor class="w-4 h-4 mr-2" />
              System
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">CPU</span>
              <span class="text-xs">45%</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">Memory</span>
              <span class="text-xs">2.1 GB</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">Disk</span>
              <span class="text-xs">128 GB</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@nvisy/shared/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@nvisy/shared/ui/card";
import {
	Plus,
	Play,
	FileText,
	File,
	Image,
	Code,
	FolderOpen,
	Folder,
	FolderPlus,
	GitBranch,
	Terminal,
	Search,
	ExternalLink,
	RefreshCw,
	MoreHorizontal,
	Activity,
	Database,
	Globe,
	Package,
	Monitor,
} from "lucide-vue-next";

// Sample data
const recentFiles = ref([
	{ id: 1, name: "main.js", path: "/src/main.js", type: "js" },
	{ id: 2, name: "App.vue", path: "/src/App.vue", type: "vue" },
	{ id: 3, name: "styles.css", path: "/src/styles.css", type: "css" },
	{ id: 4, name: "README.md", path: "/README.md", type: "md" },
]);

const projectStats = ref({
	files: 47,
	folders: 12,
	size: "2.3 MB",
	lastModified: "2 hours ago",
	branch: "main",
	status: "clean",
});

const fileTree = ref([
	{ id: 1, name: "src", type: "folder", level: 0 },
	{ id: 2, name: "components", type: "folder", level: 1 },
	{ id: 3, name: "App.vue", type: "file", extension: "vue", level: 2 },
	{ id: 4, name: "main.js", type: "file", extension: "js", level: 1 },
	{ id: 5, name: "assets", type: "folder", level: 1 },
	{ id: 6, name: "logo.png", type: "file", extension: "png", level: 2 },
	{ id: 7, name: "public", type: "folder", level: 0 },
	{ id: 8, name: "index.html", type: "file", extension: "html", level: 1 },
	{ id: 9, name: "package.json", type: "file", extension: "json", level: 0 },
]);

const recentActivity = ref([
	{ id: 1, action: "Modified main.js", timestamp: "2 minutes ago" },
	{ id: 2, action: "Created new component", timestamp: "15 minutes ago" },
	{ id: 3, action: "Committed changes", timestamp: "1 hour ago" },
	{ id: 4, action: "Pulled latest changes", timestamp: "3 hours ago" },
]);

// Helper function to get appropriate icon for file types
const getFileIcon = (type: string) => {
	switch (type) {
		case "js":
		case "ts":
		case "vue":
		case "jsx":
		case "tsx":
			return Code;
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
		case "svg":
			return Image;
		default:
			return File;
	}
};

// Set page meta
definePageMeta({
	title: "Dashboard - Nvisy",
	description: "Desktop application dashboard",
});

// Set page head
useHead({
	title: "Dashboard - Nvisy",
});
</script>
