<script setup lang="ts">
import { ref } from "vue";
import { ChevronDown, FileText } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

definePageMeta({
	breadcrumbs: [{ label: "[account]" }, { label: "Billing" }],
});

// Form data
const invoiceEmail = ref("billing@company.com");
const companyName = ref("Acme Corporation");
const billingAddress = ref("");
const selectedLanguage = ref("en");
const selectedCountry = ref("");

// Available languages
const availableLanguages = [
	{ code: "en", name: "English" },
	{ code: "fr", name: "French" },
	{ code: "de", name: "German" },
	{ code: "es", name: "Spanish" },
];

// Countries
const countries = [
	{ code: "US", name: "United States" },
	{ code: "CA", name: "Canada" },
	{ code: "GB", name: "United Kingdom" },
	{ code: "DE", name: "Germany" },
	{ code: "FR", name: "France" },
	{ code: "ES", name: "Spain" },
	{ code: "IT", name: "Italy" },
	{ code: "NL", name: "Netherlands" },
];

// Payment method
const paymentMethod = ref({
	type: "card",
	last4: "4242",
	brand: "Visa",
	expiryMonth: "12",
	expiryYear: "2025",
});

// Functions
function selectLanguage(language: string) {
	selectedLanguage.value = language;
}

function selectCountry(country: string) {
	selectedCountry.value = country;
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

function updatePaymentMethod() {
	console.log("Updating payment method");
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Billing
          </h1>
          <p class="text-neutral-600 dark:text-neutral-400">
            Manage your billing information and payment settings
          </p>
        </div>
        <Button as-child>
          <NuxtLink to="/account/invoices" class="flex items-center gap-2">
            <FileText :size="16" />
            View Invoices
          </NuxtLink>
        </Button>
      </div>

      <!-- Payment Method -->
      <Card class="mb-6 py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-12 h-8 bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center">
                <span class="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  {{ paymentMethod.brand }}
                </span>
              </div>
              <div>
                <p class="font-medium text-neutral-900 dark:text-white">
                  {{ paymentMethod.brand }} ending in {{ paymentMethod.last4 }}
                </p>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  Expires {{ paymentMethod.expiryMonth }}/{{ paymentMethod.expiryYear }}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" @click="updatePaymentMethod">
              Update
            </Button>
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            We accept Visa, Mastercard, American Express, and Discover cards.
          </p>
        </CardFooter>
      </Card>

      <!-- Invoice Email Recipient -->
      <Card class="mb-6 py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Invoice Email Recipient</CardTitle>
          <CardDescription>Email address for invoice delivery</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Label for="invoiceEmail">Email Address</Label>
            <Input
              id="invoiceEmail"
              v-model="invoiceEmail"
              type="email"
              placeholder="billing@example.com"
              class="max-w-md"
            />
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            This email address will receive all invoices and billing notifications.
          </p>
          <Button size="sm" @click="saveInvoiceEmail">
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      <!-- Company Name -->
      <Card class="mb-6 py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Company Name</CardTitle>
          <CardDescription>Company name for invoices and receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Label for="companyName">Company Name</Label>
            <Input
              id="companyName"
              v-model="companyName"
              placeholder="Your Company Inc."
              class="max-w-md"
            />
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            This name will appear on all your invoices and receipts.
          </p>
          <Button size="sm" @click="saveCompanyName">
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      <!-- Billing Address -->
      <Card class="mb-6 py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Billing Address</CardTitle>
          <CardDescription>Address for tax calculations and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4 max-w-md">
            <div class="space-y-2">
              <Label for="country">Country</Label>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="w-full justify-between">
                    {{ selectedCountry ? countries.find(c => c.code === selectedCountry)?.name : 'Select country' }}
                    <ChevronDown :size="16" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-full">
                  <DropdownMenuItem
                    v-for="country in countries"
                    :key="country.code"
                    @click="selectCountry(country.code)"
                  >
                    {{ country.name }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div class="space-y-2">
              <Label for="address">Address</Label>
              <Textarea
                id="address"
                v-model="billingAddress"
                placeholder="123 Main St&#10;City, State 12345"
                rows="3"
                class="resize-none"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            This address will be used for tax calculations and invoice documentation.
          </p>
          <Button size="sm" @click="saveBillingAddress">
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      <!-- Invoice Language -->
      <Card class="mb-6 py-0 pt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Invoice Language</CardTitle>
          <CardDescription>Language for invoices and billing communications</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Label for="language">Language</Label>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" class="w-48 justify-between">
                  {{ availableLanguages.find(l => l.code === selectedLanguage)?.name || 'Select language' }}
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
          </div>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Choose the language for your invoices and billing communications.
          </p>
          <Button size="sm" @click="saveInvoiceLanguage">
            Save Changes
          </Button>
        </CardFooter>
      </Card>

    </div>
  </div>
</template>
