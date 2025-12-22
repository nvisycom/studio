<script setup lang="ts">
import { ref, computed } from "vue";
import { Wallet, ChevronDown } from "lucide-vue-next";
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
  pageName: "Billing",
});

// Reactive data
const invoiceEmail = ref("billing@company.com");
const companyName = ref("Acme Corporation");
const billingAddress = ref("");

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
function updatePaymentMethod() {
  console.log("Opening payment method update");
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

function selectCountry(country: string) {
  selectedCountry.value = country;
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <div class="space-y-6">
        <!-- Payment Method -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
          id="billing-payment"
        >
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
                <TableRow v-for="method in paymentMethods" :key="method.id">
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <Wallet :size="20" class="text-neutral-400" />
                      <div>
                        <p
                          class="font-medium text-neutral-900 dark:text-white text-sm"
                        >
                          {{ method.brand }} •••• {{ method.last4 }}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      class="text-sm text-neutral-600 dark:text-neutral-400"
                    >
                      {{ method.expiryMonth }}/{{ method.expiryYear }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      v-if="method.isDefault"
                      class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    >
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

            <Empty
              v-else
              class="border border-dashed border-neutral-200 dark:border-neutral-700"
            >
              <Wallet :size="48" class="mx-auto text-neutral-400 mb-4" />
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
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              We accept Visa, Mastercard, American Express, and Discover cards.
            </p>
          </CardFooter>
        </Card>

        <!-- Invoice Email -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
          id="billing-email"
        >
          <CardHeader>
            <CardTitle>Invoice Email Recipient</CardTitle>
            <CardDescription
              >Email address for invoice delivery</CardDescription
            >
          </CardHeader>
          <CardContent>
            <Input
              v-model="invoiceEmail"
              type="email"
              placeholder="billing@example.com"
              class="max-w-md"
            />
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              This email address will receive all invoices and billing
              notifications.
            </p>
            <Button size="sm" @click="saveInvoiceEmail"> Save </Button>
          </CardFooter>
        </Card>

        <!-- Company Name -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
          id="billing-company"
        >
          <CardHeader>
            <CardTitle>Company Name</CardTitle>
            <CardDescription
              >Company name for invoices and receipts</CardDescription
            >
          </CardHeader>
          <CardContent>
            <Input
              v-model="companyName"
              placeholder="Your Company Inc."
              class="max-w-md"
            />
          </CardContent>
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              This name will appear on all your invoices and receipts.
            </p>
            <Button size="sm" @click="saveCompanyName"> Save </Button>
          </CardFooter>
        </Card>

        <!-- Billing Address -->
        <Card
          class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800"
          id="billing-address"
        >
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
            <CardDescription
              >Address for tax calculations and invoices</CardDescription
            >
          </CardHeader>
          <CardContent>
            <div class="space-y-3 max-w-md">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="w-full justify-between">
                    {{
                      selectedCountry
                        ? countries.find((c) => c.code === selectedCountry)
                            ?.name
                        : "Select country"
                    }}
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
          <CardFooter
            class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl flex items-center justify-between"
          >
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              This address will be used for tax calculations and invoice
              documentation.
            </p>
            <Button size="sm" @click="saveBillingAddress"> Save </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>
