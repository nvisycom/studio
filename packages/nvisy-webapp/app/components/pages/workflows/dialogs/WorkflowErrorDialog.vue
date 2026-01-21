<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
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
}>();
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Cannot Run Workflow</AlertDialogTitle>
        <AlertDialogDescription as="div">
          <p class="mb-2">
            The workflow has the following errors that must be fixed:
          </p>
          <ul class="list-disc pl-4 space-y-1">
            <li v-for="(message, index) in messages" :key="index">
              {{ message }}
            </li>
          </ul>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction>OK</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
