<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          @nvisy/ui Component Library Test
        </h1>
        <p class="text-lg text-gray-600">
          Testing our shared Vue component library with different variants and sizes
        </p>
      </div>

      <!-- Basic Examples -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 mb-6">Basic Examples</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Default -->
          <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">Default</h3>
            <HelloWorld @click="handleClick" />
          </div>

          <!-- With Title -->
          <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">With Title</h3>
            <HelloWorld
              title="Welcome!"
              message="This is our component library in action"
              @click="handleClick"
            />
          </div>
        </div>
      </section>

      <!-- Variants -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 mb-6">Variants</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">Primary</h3>
            <HelloWorld
              variant="primary"
              message="Primary variant"
              button-text="Primary Button"
              @click="handleClick"
            />
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">Secondary</h3>
            <HelloWorld
              variant="secondary"
              message="Secondary variant"
              button-text="Secondary Button"
              @click="handleClick"
            />
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">Success</h3>
            <HelloWorld
              variant="success"
              message="Success variant"
              button-text="Success Button"
              @click="handleClick"
            />
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">Warning</h3>
            <HelloWorld
              variant="warning"
              message="Warning variant"
              button-text="Warning Button"
              @click="handleClick"
            />
          </div>
        </div>
      </section>

      <!-- Sizes -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 mb-6">Sizes</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">Small</h3>
            <HelloWorld
              size="sm"
              title="Small Size"
              message="This is the small variant"
              button-text="Small Button"
              @click="handleClick"
            />
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">Medium</h3>
            <HelloWorld
              size="md"
              title="Medium Size"
              message="This is the medium variant"
              button-text="Medium Button"
              @click="handleClick"
            />
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">Large</h3>
            <HelloWorld
              size="lg"
              title="Large Size"
              message="This is the large variant"
              button-text="Large Button"
              @click="handleClick"
            />
          </div>
        </div>
      </section>

      <!-- States -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 mb-6">States</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">Normal</h3>
            <HelloWorld
              title="Normal State"
              message="This button is enabled"
              button-text="Click Me"
              @click="handleClick"
            />
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">Disabled</h3>
            <HelloWorld
              title="Disabled State"
              message="This button is disabled"
              button-text="Can't Click"
              :disabled="true"
              @click="handleClick"
            />
          </div>

          <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">No Button</h3>
            <HelloWorld
              title="No Button"
              message="This component has no button"
              :show-button="false"
              @click="handleClick"
            />
          </div>
        </div>
      </section>

      <!-- Interactive Example -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 mb-6">Interactive Example</h2>
        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Controls -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gray-700">Customize Component</h3>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  v-model="customTitle"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter title..."
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  v-model="customMessage"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter message..."
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Variant
                </label>
                <select
                  v-model="customVariant"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <select
                  v-model="customSize"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>

              <div class="flex items-center space-x-4">
                <label class="flex items-center">
                  <input
                    v-model="customShowButton"
                    type="checkbox"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  >
                  <span class="ml-2 text-sm text-gray-700">Show Button</span>
                </label>

                <label class="flex items-center">
                  <input
                    v-model="customDisabled"
                    type="checkbox"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  >
                  <span class="ml-2 text-sm text-gray-700">Disabled</span>
                </label>
              </div>
            </div>

            <!-- Preview -->
            <div class="space-y-4">
              <h3 class="text-lg font-medium text-gray-700">Preview</h3>
              <HelloWorld
                :title="customTitle || undefined"
                :message="customMessage"
                :variant="customVariant"
                :size="customSize"
                :show-button="customShowButton"
                :disabled="customDisabled"
                button-text="Custom Button"
                @click="handleClick"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Click Events Log -->
      <section v-if="clickEvents.length > 0" class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 mb-6">Click Events Log</h2>
        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="space-y-2">
            <div
              v-for="(event, index) in clickEvents.slice().reverse()"
              :key="index"
              class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm"
            >
              <span>Button clicked at {{ event.timestamp }}</span>
              <span class="text-gray-500">Event #{{ clickEvents.length - index }}</span>
            </div>
          </div>
          <button
            @click="clearClickEvents"
            class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Clear Log
          </button>
        </div>
      </section>

      <!-- Utility Functions Demo -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-800 mb-6">Utility Functions Demo</h2>
        <div class="bg-white rounded-lg shadow-lg p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-medium text-gray-700 mb-3">Class Name Utility</h3>
              <div class="space-y-2">
                <div :class="cn('p-3 rounded', 'bg-blue-100', true && 'border border-blue-300')">
                  Using cn('p-3 rounded', 'bg-blue-100', true && 'border border-blue-300')
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-medium text-gray-700 mb-3">Utility Functions</h3>
              <div class="space-y-2 text-sm">
                <div>getInitials('John Doe Smith'): <strong>{{ getInitials('John Doe Smith') }}</strong></div>
                <div>calculateReadingTime('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'): <strong>{{ calculateReadingTime('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.') }} min</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HelloWorld, getInitials, calculateReadingTime, cn } from '@nvisy/ui'
import type { HelloWorldVariant, HelloWorldSize } from '@nvisy/ui'

// Page metadata
useHead({
  title: 'Component Library Test - Nvisy Desktop',
  meta: [
    { name: 'description', content: 'Testing the @nvisy/ui component library' }
  ]
})

// Interactive example state
const customTitle = ref('Custom Title')
const customMessage = ref('This is a customizable message!')
const customVariant = ref<HelloWorldVariant>('primary')
const customSize = ref<HelloWorldSize>('md')
const customShowButton = ref(true)
const customDisabled = ref(false)

// Click events tracking
const clickEvents = ref<Array<{ timestamp: string }>>([])

// Event handlers
const handleClick = (event: MouseEvent) => {
  console.log('HelloWorld button clicked:', event)
  clickEvents.value.push({
    timestamp: new Date().toLocaleTimeString()
  })
}

const clearClickEvents = () => {
  clickEvents.value = []
}
</script>
