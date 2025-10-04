<script lang="ts" setup>
import type { PrimitiveProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { Primitive } from "reka-ui";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<
    PrimitiveProps & { class?: HTMLAttributes["class"]; href?: string }
  >(),
  {
    as: "a",
  }
);
</script>

<template>
  <Primitive
    data-slot="breadcrumb-link"
    :as="as"
    :as-child="asChild"
    :href="href"
    :class="cn('hover:text-foreground transition-colors', props.class)"
  >
    <slot />
  </Primitive>
</template>
