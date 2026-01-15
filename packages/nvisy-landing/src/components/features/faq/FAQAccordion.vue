<script setup lang="ts">
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Props {
  faqs: FAQItem[];
}

const props = defineProps<Props>();
</script>

<template>
  <Accordion type="single" collapsible class="space-y-3">
    <AccordionItem
      v-for="faq in faqs"
      :key="faq.question"
      :value="faq.question"
      class="bg-card border border-border rounded-lg px-5 transition-colors duration-200"
    >
      <AccordionTrigger
        class="text-base font-medium text-foreground hover:text-foreground/80"
      >
        {{ faq.question }}
      </AccordionTrigger>
      <AccordionContent
        class="text-sm text-muted-foreground leading-relaxed pb-1"
      >
        {{ faq.answer }}
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>
