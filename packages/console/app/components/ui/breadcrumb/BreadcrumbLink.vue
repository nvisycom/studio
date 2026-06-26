<script lang="ts" setup>
import type { PrimitiveProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { Primitive } from "reka-ui";
import { cn } from "#console/utils/shadcn";

const props = withDefaults(
	defineProps<PrimitiveProps & { class?: HTMLAttributes["class"] }>(),
	{
		as: "a",
	},
);
</script>

<template>
  <Primitive
    data-slot="breadcrumb-link"
    :as="as"
    :as-child="asChild"
    :class="
      cn(
        'hover:text-foreground text-sm font-normal transition-colors',
        props.class,
      )
    "
  >
    <slot />
  </Primitive>
</template>
