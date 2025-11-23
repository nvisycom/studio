<script setup lang="ts">
import { ref } from "vue";

const name = ref("");
const email = ref("");
const inquiryType = ref("");
const message = ref("");

const _handleSubmit = (e: Event) => {
	e.preventDefault();
	// Handle form submission
	console.log({
		name: name.value,
		email: email.value,
		inquiryType: inquiryType.value,
		message: message.value,
	});
};
</script>

<template>
  <div
    class="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-sm p-8 md:p-12"
  >
    <div class="mb-10">
      <h2
        class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
      >
        Send us a Message
      </h2>
      <p class="text-lg text-gray-600 dark:text-neutral-400">
        We'll get back to you within 24 hours.
      </p>
    </div>

    <form class="space-y-6" @submit="handleSubmit">
      <div>
        <label
          for="name"
          class="block text-sm font-medium text-gray-900 dark:text-white mb-2"
        >
          Name *
        </label>
        <input
          type="text"
          name="name"
          id="name"
          v-model="name"
          required
          class="w-full px-4 py-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-neutral-500 focus:border-transparent transition-all"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label
          for="email"
          class="block text-sm font-medium text-gray-900 dark:text-white mb-2"
        >
          Email *
        </label>
        <input
          type="email"
          name="email"
          id="email"
          v-model="email"
          required
          class="w-full px-4 py-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-neutral-500 focus:border-transparent transition-all"
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label
          for="inquiry-type"
          class="block text-sm font-medium text-gray-900 dark:text-white mb-2"
        >
          Inquiry Type *
        </label>
        <Select v-model="inquiryType" required>
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Select an inquiry type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="sales"> Sales Inquiry </SelectItem>
              <SelectItem value="demo"> Request Demo </SelectItem>
              <SelectItem value="support"> Technical Support </SelectItem>
              <SelectItem value="partnership"> Partnership </SelectItem>
              <SelectItem value="general"> General Question </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label
          for="message"
          class="block text-sm font-medium text-gray-900 dark:text-white mb-2"
        >
          Message *
        </label>
        <Textarea
          id="message"
          v-model="message"
          placeholder="Tell us more about your needs..."
          class="min-h-[150px]"
          required
        />
      </div>

      <button
        type="submit"
        class="w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-3.5 px-8 rounded-lg hover:bg-gray-800 dark:hover:bg-neutral-200 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        Send Message
      </button>

      <p class="text-xs text-center text-gray-500 dark:text-neutral-500 mt-4">
        By submitting this form, you agree to our privacy policy.
      </p>
    </form>
  </div>
</template>
