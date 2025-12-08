<script setup lang="ts">
import { ref, computed } from "vue";
import { CreditCard, ChevronDown, FileText, Download } from "lucide-vue-next";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Button from "@/components/ui/button/Button.vue";
import Empty from "@/components/ui/empty/Empty.vue";
import Input from "@/components/ui/input/Input.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
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
	breadcrumbs: [
		{ label: "[project]" },
		{
			label: "Settings",
			href: "/settings",
		},
		{
			label: "Billing",
			dropdown: [
				{ label: "General", value: "/settings" },
				{ label: "Billing", value: "/settings/billing" },
				{ label: "Notifications", value: "/settings/notifications" },
				{ label: "Security", value: "/settings/security" },
			],
		},
	],
});

// Mock useI18n since it's not available
const useI18n = () => ({
	locales: ref([
		{ code: "en", name: "English" },
		{ code: "fr", name: "French" },
		{ code: "de", name: "German" },
	]),
});

// Reactive data
const invoiceEmail = ref("billing@company.com");
const companyName = ref("Acme Corporation");
const billingAddress = ref("");
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

// Mock payment methods data
const paymentMethods = [
	{
		id: "1",
		type: "card",
		last4: "4242",
		brand: "Visa",
		expiryMonth: 12,
		expiryYear: 2024,
		isDefault: true,
	},
];

// Plan usage data
const planUsage = {
	documentsUsed: 20,
	documentsLimit: 50,
	currentPlan: "Basic",
};

// Countries for billing address
const countries = [
	{ code: "US", name: "United States" },
	{ code: "CA", name: "Canada" },
	{ code: "GB", name: "United Kingdom" },
	{ code: "DE", name: "Germany" },
	{ code: "FR", name: "France" },
	{ code: "ES", name: "Spain" },
	{ code: "IT", name: "Italy" },
	{ code: "NL", name: "Netherlands" },
	{ code: "AU", name: "Australia" },
	{ code: "JP", name: "Japan" },
];

const selectedCountry = ref("");

// Functions
function changePlan() {
	console.log("Opening plan change dialog");
}

function updatePaymentMethod() {
	console.log("Opening payment method update");
}

function addAddon() {
	console.log("Adding Advanced Analytics addon");
}

function saveInvoiceEmail() {
	console.log("Saving invoice email:", invoiceEmail.value);
}

function saveCompanyName() {
	console.log("Saving company name:", companyName.value);
}

function saveBillingAddress() {
	console.log("Saving billing address:", billingAddress.value);
}

function saveInvoiceLanguage() {
	console.log("Saving invoice language:", selectedLanguage.value);
}

function selectLanguage(language: string) {
	selectedLanguage.value = language;
}

function selectCountry(country: string) {
	selectedCountry.value = country;
}

function toggleAddon(addonId: string) {
	const addon = addons.value.find((a) => a.id === addonId);
	if (addon) {
		addon.enabled = !addon.enabled;
	}
}

// Invoice data
interface Invoice {
	id: string;
	number: string;
	date: string;
	amount: string;
	status: "paid" | "pending" | "failed";
}

const invoices = ref<Invoice[]>([
	{
		id: "1",
		number: "INV-001",
		date: "Dec 1, 2023",
		amount: "$49.00",
		status: "paid",
	},
	{
		id: "2",
		number: "INV-002",
		date: "Nov 1, 2023",
		amount: "$49.00",
		status: "paid",
	},
	{
		id: "3",
		number: "INV-003",
		date: "Oct 1, 2023",
		amount: "$49.00",
		status: "paid",
	},
]);

function downloadInvoice(invoiceId: string) {
	console.log("Downloading invoice:", invoiceId);
}

function getStatusColor(status: string) {
	switch (status) {
		case "paid":
			return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
		case "pending":
			return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
		case "failed":
			return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
		default:
			return "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200";
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Billing
        </h1>
        <p class="text-neutral-600 dark:text-neutral-400">
          Manage your subscription and payment information
        </p>
      </div>

      <div class="space-y-6">

        <!-- Plan -->
        <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800" id="billing-plan">
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>Your current subscription plan and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="p-6 bg-white dark:bg-black space-y-6">
              <div class="grid grid-cols-2 gap-8">
                <div class="space-y-2">
                  <span class="font-semibold text-lg text-neutral-900 dark:text-white">{{ planUsage.currentPlan }} Plan</span>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ planUsage.currentPlan === 'Basic' ? 'Perfect for getting started' : 'Everything you need for professional projects' }}
                  </p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400">
                    Next billing: January 15, 2024
                  </p>
                </div>
                <div class="flex items-start justify-end">
                  <span class="text-2xl font-bold text-neutral-900 dark:text-white">
                    ${{ planUsage.currentPlan === 'Basic' ? '29' : '49' }}<span class="text-sm font-normal text-neutral-600 dark:text-neutral-400">/mo</span>
                  </span>
                </div>
              </div>

              <!-- Document Usage Slider -->
              <div>
                <div class="mb-2">
                  <span class="text-sm font-medium text-neutral-900 dark:text-white">Document Redactions</span>
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
                  <div class="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                    <span>Min: 10</span>
                    <span>Current: {{ planUsage.documentsUsed }}</span>
                    <span>Max: 50</span>
                  </div>
                </div>
              </div>

              <!-- Enabled Add-ons -->
              <div v-if="addons.some(a => a.enabled)" class="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <h4 class="text-sm font-medium text-neutral-900 dark:text-white mb-3">Active Add-ons</h4>
                <div class="space-y-2">
                  <div
                    v-for="addon in addons.filter(a => a.enabled)"
                    :key="addon.id"
                    class="flex justify-between items-center"
                  >
                    <span class="text-sm text-neutral-700 dark:text-neutral-300">{{ addon.name }}</span>
                    <span class="text-sm font-medium text-neutral-900 dark:text-white">
                      ${{ addon.price }}/mo
                    </span>
                  </div>
                  <div class="pt-2 border-t border-neutral-200 dark:border-neutral-600 flex justify-between items-center">
                    <span class="text-sm font-medium text-neutral-900 dark:text-white">Total Add-ons:</span>
                    <span class="text-sm font-semibold text-neutral-900 dark:text-white">
                      ${{ addons.filter(a => a.enabled).reduce((sum, addon) => sum + addon.price, 0) }}/mo
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  @click="changePlan"
                >
                  Change Plan
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  @click="changePlan"
                >
                  {{ planUsage.currentPlan === 'Basic' ? 'Upgrade to Pro' : 'Upgrade to Business' }}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Changes take effect immediately. <a href="https://nvisy.com/pricing" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">Learn more about pricing here</a>
            </p>
          </CardFooter>
        </Card>

        <!-- Invoice History -->
        <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800" id="invoices-list">
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>Download and view your past invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <!-- Invoice Table -->
            <div class="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
              <div v-if="invoices.length > 0" class="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead class="px-6">Invoice</TableHead>
                      <TableHead class="px-6">Date</TableHead>
                      <TableHead class="px-6">Amount</TableHead>
                      <TableHead class="px-6">Status</TableHead>
                      <TableHead class="px-6 w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow
                      v-for="invoice in invoices"
                      :key="invoice.id"
                      class="hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    >
                      <TableCell class="px-6">
                        <div class="flex items-center gap-3">
                          <FileText :size="16" class="text-neutral-400" />
                          <span class="font-medium text-neutral-900 dark:text-white text-sm">
                            {{ invoice.number }}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell class="px-6">
                        <span class="text-sm text-neutral-600 dark:text-neutral-400">
                          {{ invoice.date }}
                        </span>
                      </TableCell>
                      <TableCell class="px-6">
                        <span class="text-sm font-medium text-neutral-900 dark:text-white">
                          {{ invoice.amount }}
                        </span>
                      </TableCell>
                      <TableCell class="px-6">
                        <span
                          class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                          :class="getStatusColor(invoice.status)"
                        >
                          {{ invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) }}
                        </span>
                      </TableCell>
                      <TableCell class="px-6">
                        <Button
                          variant="outline"
                          size="sm"
                          @click="downloadInvoice(invoice.id)"
                          class="flex items-center gap-1"
                        >
                          <Download :size="14" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <!-- Empty state -->
              <Empty v-else class="py-12">
                <div class="text-center">
                  <FileText :size="48" class="mx-auto text-neutral-400 mb-4" />
                  <h4 class="font-medium text-neutral-900 dark:text-white mb-2">No invoices yet</h4>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    Your invoices will appear here once you start getting billed
                  </p>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    Invoices are generated monthly based on your usage
                  </p>
                </div>
              </Empty>
            </div>
          </CardContent>
          <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Invoices are generated monthly and sent to your billing email address. You can download them as PDF files.
            </p>
          </CardFooter>
        </Card>

        <!-- Payment Method -->
        <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800" id="billing-payment">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <Table v-if="paymentMethods.length > 0">
              <TableHeader>
                <TableRow>
                  <TableHead>Card</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead class="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="method in paymentMethods"
                  :key="method.id"
                >
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <CreditCard :size="20" class="text-neutral-400" />
                      <div>
                        <p class="font-medium text-neutral-900 dark:text-white text-sm">
                          {{ method.brand }} •••• {{ method.last4 }}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span class="text-sm text-neutral-600 dark:text-neutral-400">
                      {{ method.expiryMonth }}/{{ method.expiryYear }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span v-if="method.isDefault" class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Default
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      @click="updatePaymentMethod"
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Empty v-else class="border border-dashed border-neutral-200 dark:border-neutral-700">
              <CreditCard :size="48" class="mx-auto text-neutral-400 mb-4" />
              <h4 class="font-medium text-neutral-900 dark:text-white mb-2">
                No payment methods
              </h4>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Add a payment method to manage your subscription
              </p>
              <Button size="sm" @click="updatePaymentMethod">
                Add Payment Method
              </Button>
            </Empty>
          </CardContent>
          <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              We accept Visa, Mastercard, American Express, and Discover cards.
            </p>
          </CardFooter>
        </Card>

        <!-- Add-Ons -->
        <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800" id="billing-addons">
          <CardHeader>
            <CardTitle>Add-Ons</CardTitle>
            <CardDescription>Enhance your project with additional features</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-6">
              <div v-for="category in ['Documents', 'Analytics']" :key="category">
                <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">{{ category }}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead class="text-right w-32">Price</TableHead>
                      <TableHead class="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="addon in addons.filter(a => a.category === category)" :key="addon.id">
                      <TableCell>
                        <div>
                          <p class="font-medium text-neutral-900 dark:text-white">{{ addon.name }}</p>
                          <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{{ addon.description }}</p>
                        </div>
                      </TableCell>
                      <TableCell class="text-right pr-6">
                        <span class="font-medium text-neutral-900 dark:text-white">
                          ${{ addon.price }}<span class="text-sm font-normal text-neutral-600 dark:text-neutral-400">/mo</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch :checked="addon.enabled" @update:checked="toggleAddon(addon.id)" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
          <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Add-ons will be prorated and appear on your next invoice.
            </p>
          </CardFooter>
        </Card>

        <!-- Invoice Email -->
        <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800" id="billing-email">
          <CardHeader>
            <CardTitle>Invoice Email Recipient</CardTitle>
            <CardDescription>Email address for invoice delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              v-model="invoiceEmail"
              type="email"
              placeholder="billing@example.com"
              class="max-w-md"
            />
          </CardContent>
          <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              This email address will receive all invoices and billing notifications.
            </p>
            <Button size="sm" @click="saveInvoiceEmail">
              Save
            </Button>
          </CardFooter>
        </Card>

        <!-- Company Name -->
        <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800" id="billing-company">
          <CardHeader>
            <CardTitle>Company Name</CardTitle>
            <CardDescription>Company name for invoices and receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              v-model="companyName"
              placeholder="Your Company Inc."
              class="max-w-md"
            />
          </CardContent>
          <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              This name will appear on all your invoices and receipts.
            </p>
            <Button size="sm" @click="saveCompanyName">
              Save
            </Button>
          </CardFooter>
        </Card>

        <!-- Billing Address -->
        <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800" id="billing-address">
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
            <CardDescription>Address for tax calculations and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3 max-w-md">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="w-full justify-between">
                    {{ selectedCountry ? countries.find(c => c.code === selectedCountry)?.name : 'Select country' }}
                    <ChevronDown :size="16" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-64">
                  <DropdownMenuItem
                    v-for="country in countries"
                    :key="country.code"
                    @click="selectCountry(country.code)"
                  >
                    {{ country.name }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Textarea
                v-model="billingAddress"
                placeholder="123 Main St&#10;City, State 12345"
                rows="3"
                class="resize-none"
              />
            </div>
          </CardContent>
          <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              This address will be used for tax calculations and invoice documentation.
            </p>
            <Button size="sm" @click="saveBillingAddress">
              Save
            </Button>
          </CardFooter>
        </Card>

        <!-- Invoice Language -->
        <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800" id="billing-language">
          <CardHeader>
            <CardTitle>Invoice Language</CardTitle>
            <CardDescription>Language for invoices and billing communications</CardDescription>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" class="w-48 justify-between">
                  {{ availableLanguages.find((l) => l.code === selectedLanguage)?.name || 'Select language' }}
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
          <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Choose the language for your invoices and billing communications.
            </p>
            <Button size="sm" @click="saveInvoiceLanguage">
              Save
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #000;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .slider::-webkit-slider-thumb {
  background: #fff;
  border: 2px solid #000;
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #000;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .slider::-moz-range-thumb {
  background: #fff;
  border: 2px solid #000;
}

.slider::-webkit-slider-track {
  height: 8px;
  border-radius: 4px;
  background: #e5e5e5;
}

.dark .slider::-webkit-slider-track {
  background: #404040;
}

.slider::-moz-range-track {
  height: 8px;
  border-radius: 4px;
  background: #e5e5e5;
  border: none;
}

.dark .slider::-moz-range-track {
  background: #404040;
}
</style>
