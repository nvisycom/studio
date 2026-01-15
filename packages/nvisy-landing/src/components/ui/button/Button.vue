<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui";
import type { HTMLAttributes, AnchorHTMLAttributes } from "vue";
import type { ButtonVariants } from ".";
import { Primitive } from "reka-ui";
import { cn } from "@/utils";
import { buttonVariants } from ".";

interface Props extends PrimitiveProps {
	variant?: ButtonVariants["variant"];
	size?: ButtonVariants["size"];
	class?: HTMLAttributes["class"];
	href?: string;
	target?: AnchorHTMLAttributes["target"];
	rel?: string;
}

const props = withDefaults(defineProps<Props>(), {
	as: "button",
});
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :href="href"
    :target="target"
    :rel="rel"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
