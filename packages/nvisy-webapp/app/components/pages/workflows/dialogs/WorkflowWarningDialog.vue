<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  messages: string[];
}

defineProps<Props>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [];
}>();

function handleConfirm() {
  emit("confirm");
}
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Workflow Warnings</AlertDialogTitle>
        <AlertDialogDescription as="div">
          <p class="mb-2">The workflow has the following warnings:</p>
          <ul class="list-disc pl-4 space-y-1">
            <li v-for="(message, index) in messages" :key="index">
              {{ message }}
            </li>
          </ul>
          <p class="mt-3">Do you want to continue anyway?</p>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction @click="handleConfirm">Continue</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
