<script setup lang="ts">
import { ref, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  roleName: string;
  roleDescription: string;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "save", data: { name: string; description: string }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localName = ref(props.roleName);
const localDescription = ref(props.roleDescription);

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      localName.value = props.roleName;
      localDescription.value = props.roleDescription;
    }
  }
);

function handleSave() {
  emit("save", {
    name: localName.value,
    description: localDescription.value,
  });
  emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Role</DialogTitle>
        <DialogDescription>
          Update role name and description.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="role-name">Role Name</Label>
          <Input
            id="role-name"
            v-model="localName"
            placeholder="Enter role name"
          />
        </div>
        <div class="grid gap-2">
          <Label for="role-description">Description</Label>
          <Textarea
            id="role-description"
            v-model="localDescription"
            placeholder="Enter role description"
            rows="3"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button @click="handleSave">Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
