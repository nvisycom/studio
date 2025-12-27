<script setup lang="ts">
import { ref } from "vue";
import { Plus, MoreVertical, Pencil, Trash2, ArrowLeft } from "lucide-vue-next";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditRoleDialog, DeleteRoleDialog } from "@/components/pages/members";

definePageMeta({
  pageName: "Members",
});

interface Role {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  isDefault: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

const roles = ref<Role[]>([
  {
    id: "1",
    name: "Owner",
    description: "Full access to all workspace features",
    membersCount: 2,
    isDefault: true,
  },
  {
    id: "2",
    name: "Editor",
    description: "Can manage documents and pipelines",
    membersCount: 5,
    isDefault: true,
  },
  {
    id: "3",
    name: "Member",
    description: "Basic access to view and upload documents",
    membersCount: 12,
    isDefault: true,
  },
]);

const permissions = ref<Permission[]>([
  {
    id: "1",
    name: "View documents",
    description: "Can view and download documents",
  },
  {
    id: "2",
    name: "Upload documents",
    description: "Can upload new documents to the workspace",
  },
  {
    id: "3",
    name: "Delete documents",
    description: "Can permanently delete documents",
  },
  {
    id: "4",
    name: "Manage pipelines",
    description: "Can create, edit, and delete automation pipelines",
  },
  {
    id: "5",
    name: "Manage integrations",
    description: "Can connect and disconnect integrations",
  },
  {
    id: "6",
    name: "Invite members",
    description: "Can invite new team members to the workspace",
  },
  {
    id: "7",
    name: "Remove members",
    description: "Can remove members from the workspace",
  },
  {
    id: "8",
    name: "Manage billing",
    description: "Can view and update billing information",
  },
  {
    id: "9",
    name: "View analytics",
    description: "Can access analytics and usage reports",
  },
  {
    id: "10",
    name: "Manage workspace settings",
    description: "Can modify workspace settings and preferences",
  },
]);

const selectedRole = ref("1");
const permissionStates = ref<Record<string, boolean>>({
  "1": true,
  "2": true,
  "3": true,
  "4": true,
  "5": true,
  "6": true,
  "7": true,
  "8": true,
  "9": true,
  "10": true,
});

const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedRoleForEdit = ref<Role | null>(null);

function createNewRole() {
  console.log("Creating new role");
}

function editRole(roleId: string) {
  const role = roles.value.find((r) => r.id === roleId);
  if (role) {
    selectedRoleForEdit.value = role;
    isEditDialogOpen.value = true;
  }
}

function saveRoleEdit(data: { name: string; description: string }) {
  if (selectedRoleForEdit.value) {
    selectedRoleForEdit.value.name = data.name;
    selectedRoleForEdit.value.description = data.description;
  }
}

function deleteRole(roleId: string) {
  const role = roles.value.find((r) => r.id === roleId);
  if (role) {
    selectedRoleForEdit.value = role;
    isDeleteDialogOpen.value = true;
  }
}

function confirmDeleteRole() {
  if (selectedRoleForEdit.value) {
    roles.value = roles.value.filter(
      (r) => r.id !== selectedRoleForEdit.value!.id,
    );
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Back to Members -->
      <NuxtLink to="/members">
        <Button variant="outline" size="sm" class="mb-4">
          <ArrowLeft :size="16" class="mr-2" />
          Back to Members
        </Button>
      </NuxtLink>

      <!-- Roles Table -->
      <Card
        class="mb-8 overflow-hidden py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                {{ roles.length }} role{{ roles.length !== 1 ? "s" : "" }} in
                your workspace
              </CardDescription>
            </div>
            <Button @click="createNewRole" size="sm" disabled>
              <Plus :size="16" class="mr-2" />
              New Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead class="w-[120px]">Members</TableHead>
                <TableHead class="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="role in roles"
                :key="role.id"
                class="hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <TableCell>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    {{ role.name }}
                  </p>
                </TableCell>
                <TableCell>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ role.description }}
                  </p>
                </TableCell>
                <TableCell>
                  <span class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ role.membersCount }} member{{
                      role.membersCount !== 1 ? "s" : ""
                    }}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <MoreVertical :size="16" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="editRole(role.id)">
                        <Pencil :size="16" class="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        @click="deleteRole(role.id)"
                        class="text-red-600 dark:text-red-400"
                      >
                        <Trash2 :size="16" class="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- Permissions Table -->
      <Card
        class="overflow-hidden py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Configure permissions for selected role
              </CardDescription>
            </div>
            <Select v-model="selectedRole">
              <SelectTrigger class="w-[180px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="role in roles"
                  :key="role.id"
                  :value="role.id"
                >
                  {{ role.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                <TableHead>Description</TableHead>
                <TableHead class="w-[80px] text-right">Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="permission in permissions"
                :key="permission.id"
                class="hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <TableCell>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    {{ permission.name }}
                  </p>
                </TableCell>
                <TableCell>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ permission.description }}
                  </p>
                </TableCell>
                <TableCell class="text-right">
                  <Switch
                    v-model:checked="permissionStates[permission.id]"
                    disabled
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter
          class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
        >
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Configure which actions each role can perform in your workspace.
            <a
              href="#"
              class="text-blue-600 dark:text-blue-400 hover:underline ml-1"
            >
              Learn more about permissions
            </a>
          </p>
        </CardFooter>
      </Card>

      <!-- Edit Role Dialog -->
      <EditRoleDialog
        v-model:open="isEditDialogOpen"
        :role-name="selectedRoleForEdit?.name ?? ''"
        :role-description="selectedRoleForEdit?.description ?? ''"
        @save="saveRoleEdit"
      />

      <!-- Delete Role Dialog -->
      <DeleteRoleDialog
        v-model:open="isDeleteDialogOpen"
        :role-name="selectedRoleForEdit?.name ?? ''"
        @confirm="confirmDeleteRole"
      />
    </div>
  </div>
</template>
