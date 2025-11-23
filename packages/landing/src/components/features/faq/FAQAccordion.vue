<script setup lang="ts">
export interface FAQItem {
	question: string;
	answer: string;
}

export interface Props {
	faqs: FAQItem[];
}

const _props = defineProps<Props>();
</script>

<template>
  <Accordion type="single" collapsible class="space-y-4">
    <AccordionItem
      v-for="faq in faqs"
      :key="faq.question"
      :value="faq.question"
      class="bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 px-6"
    >
      <AccordionTrigger class="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
        {{ faq.question }}
      </AccordionTrigger>
      <AccordionContent class="text-gray-600 dark:text-neutral-400 leading-relaxed">
        {{ faq.answer }}
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>
