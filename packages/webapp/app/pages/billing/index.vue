<script setup lang="ts">
import { ref, computed } from "vue";
import { ChevronDown } from "lucide-vue-next";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Button from "@/components/ui/button/Button.vue";
import Switch from "@/components/ui/switch/Switch.vue";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

definePageMeta({
  pageCategory: "Billing",
});

// Reactive data
const selectedLanguage = ref("en");

// Using i18n languages
const { locales } = useI18n();
const availableLanguages = computed(() => locales.value);

// Addon settings with pricing
const addons = ref([
  {
    id: "aiAssistant",
    name: "AI Assistant",
    description: "Intelligent document analysis and suggestions",
    price: 15,
    category: "Documents",
    enabled: false,
  },
  {
    id: "onPremiseProcessing",
    name: "On-Premise Processing",
    description: "Process documents on your own infrastructure",
    price: 25,
    category: "Documents",
    enabled: false,
  },
  {
    id: "aiInsights",
    name: "AI Insights",
    description: "Advanced analytics powered by artificial intelligence",
    price: 20,
    category: "Analytics",
    enabled: true,
  },
  {
    id: "advancedAnalytics",
    name: "Advanced Analytics",
    description: "Detailed reporting and usage statistics",
    price: 10,
    category: "Analytics",
    enabled: false,
  },
]);

// Plan usage data
const planUsage = {
  documentsUsed: 20,
  documentsLimit: 50,
  currentPlan: "Basic",
};

// Functions
function changePlan() {
  console.log("Opening plan change dialog");
}

function saveInvoiceLanguage() {
  console.log("Saving invoice language:", selectedLanguage.value);
}

function selectLanguage(language: string) {
  selectedLanguage.value = language;
}

function toggleAddon(addonId: string) {
  const addon = addons.value.find((a) => a.id === addonId);
  if (addon) {
    addon.enabled = !addon.enabled;
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <div class="space-y-6">
        <!-- Plan -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
          id="billing-plan"
        >
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription
              >Your current subscription plan and usage</CardDescription
            >
          </CardHeader>
          <CardContent>
            <div class="p-6 bg-white dark:bg-black space-y-6">
              <div class="grid grid-cols-2 gap-8">
                <div class="space-y-2">
                  <span
                    class="font-medium text-lg text-neutral-900 dark:text-white"
                    >{{ planUsage.currentPlan }} Plan</span
                  >
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{
                      planUsage.currentPlan === "Basic"
                        ? "Perfect for getting started"
                        : "Everything you need for professional projects"
                    }}
                  </p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400">
                    Next billing: January 15, 2024
                  </p>
                </div>
                <div class="flex items-start justify-end">
                  <span
                    class="text-2xl font-medium text-neutral-900 dark:text-white"
                  >
                    ${{ planUsage.currentPlan === "Basic" ? "29" : "49"
                    }}<span
                      class="text-sm font-normal text-neutral-600 dark:text-neutral-400"
                      >/mo</span
                    >
                  </span>
                </div>
              </div>

              <!-- Document Usage Slider -->
              <div>
                <div class="mb-2">
                  <span
                    class="text-sm font-medium text-neutral-900 dark:text-white"
                    >Document Redactions</span
                  >
                </div>
                <div class="space-y-2">
                  <input
                    type="range"
                    :min="10"
                    :max="50"
                    :step="10"
                    :value="planUsage.documentsUsed"
                    class="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div
                    class="flex justify-between text-xs text-neutral-600 dark:text-neutral-400"
                  >
                    <span>Min: 10</span>
                    <span>Current: {{ planUsage.documentsUsed }}</span>
                    <span>Max: 50</span>
                  </div>
                </div>
              </div>

              <!-- Enabled Add-ons -->
              <div
                v-if="addons.some((a) => a.enabled)"
                class="border-t border-neutral-200 dark:border-neutral-700 pt-4"
              >
                <h4
                  class="text-sm font-medium text-neutral-900 dark:text-white mb-3"
                >
                  Active Add-ons
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="addon in addons.filter((a) => a.enabled)"
                    :key="addon.id"
                    class="flex justify-between items-center"
                  >
                    <span
                      class="text-sm text-neutral-700 dark:text-neutral-300"
                      >{{ addon.name }}</span
                    >
                    <span
                      class="text-sm font-medium text-neutral-900 dark:text-white"
                    >
                      ${{ addon.price }}/mo
                    </span>
                  </div>
                  <div
                    class="pt-2 border-t border-neutral-200 dark:border-neutral-600 flex justify-between items-center"
                  >
                    <span
                      class="text-sm font-medium text-neutral-900 dark:text-white"
                      >Total Add-ons:</span
                    >
                    <span
                      class="text-sm font-medium text-neutral-900 dark:text-white"
                    >
                      ${{
                        addons
                          .filter((a) => a.enabled)
                          .reduce((sum, addon) => sum + addon.price, 0)
                      }}/mo
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" @click="changePlan">
                  Change Plan
                </Button>
                <Button variant="default" size="sm" @click="changePlan">
                  {{
                    planUsage.currentPlan === "Basic"
                      ? "Upgrade to Pro"
                      : "Upgrade to Business"
                  }}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Changes take effect immediately.
              <a
                href="https://nvisy.com/pricing"
                target="_blank"
                class="text-blue-600 dark:text-blue-400 hover:underline"
                >Learn more about pricing here</a
              >
            </p>
          </CardFooter>
        </Card>

        <!-- Add-Ons -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
          id="billing-addons"
        >
          <CardHeader>
            <CardTitle>Add-Ons</CardTitle>
            <CardDescription
              >Enhance your project with additional features</CardDescription
            >
          </CardHeader>
          <CardContent>
            <div class="space-y-6">
              <div
                v-for="category in ['Documents', 'Analytics']"
                :key="category"
              >
                <h4
                  class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3"
                >
                  {{ category }}
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead class="text-right w-32">Price</TableHead>
                      <TableHead class="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow
                      v-for="addon in addons.filter(
                        (a) => a.category === category,
                      )"
                      :key="addon.id"
                    >
                      <TableCell>
                        <div>
                          <p
                            class="font-medium text-neutral-900 dark:text-white"
                          >
                            {{ addon.name }}
                          </p>
                          <p
                            class="text-sm text-neutral-600 dark:text-neutral-400 mt-1"
                          >
                            {{ addon.description }}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell class="text-right pr-6">
                        <span
                          class="font-medium text-neutral-900 dark:text-white"
                        >
                          ${{ addon.price
                          }}<span
                            class="text-sm font-normal text-neutral-600 dark:text-neutral-400"
                            >/mo</span
                          >
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch
                          :checked="addon.enabled"
                          @update:checked="toggleAddon(addon.id)"
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Add-ons will be prorated and appear on your next invoice.
            </p>
          </CardFooter>
        </Card>

        <!-- Invoice Language -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
          id="billing-language"
        >
          <CardHeader>
            <CardTitle>Invoice Language</CardTitle>
            <CardDescription
              >Language for invoices and billing communications</CardDescription
            >
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" class="w-48 justify-between">
                  {{
                    availableLanguages.find((l) => l.code === selectedLanguage)
                      ?.name || "Select language"
                  }}
                  <ChevronDown :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  v-for="language in availableLanguages"
                  :key="language.code"
                  @click="selectLanguage(language.code)"
                >
                  {{ language.name }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Choose the language for your invoices and billing communications.
            </p>
            <Button size="sm" @click="saveInvoiceLanguage"> Save </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>
