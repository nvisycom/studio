<script setup lang="ts">
import { ref } from "vue";
import { Download, ArrowLeft } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

definePageMeta({
	breadcrumbs: [
		{ label: "[account]" },
		{ label: "Billing", href: "/account/billing" },
		{ label: "Invoices" },
	],
});

// Invoices data
const invoices = ref([
	{
		id: "INV-2024-001",
		date: "2024-01-20",
		amount: 29.0,
		status: "paid",
		description: "Pro Plan - Monthly",
		paymentMethod: "Visa •••• 4242",
	},
	{
		id: "INV-2023-012",
		date: "2023-12-20",
		amount: 29.0,
		status: "paid",
		description: "Pro Plan - Monthly",
		paymentMethod: "Visa •••• 4242",
	},
	{
		id: "INV-2023-011",
		date: "2023-11-20",
		amount: 29.0,
		status: "paid",
		description: "Pro Plan - Monthly",
		paymentMethod: "Visa •••• 4242",
	},
	{
		id: "INV-2023-010",
		date: "2023-10-20",
		amount: 29.0,
		status: "paid",
		description: "Pro Plan - Monthly",
		paymentMethod: "Visa •••• 4242",
	},
	{
		id: "INV-2023-009",
		date: "2023-09-20",
		amount: 29.0,
		status: "paid",
		description: "Pro Plan - Monthly",
		paymentMethod: "Visa •••• 4242",
	},
]);

function downloadInvoice(invoiceId: string) {
	console.log("Downloading invoice:", invoiceId);
}

function getStatusClass(status: string) {
	switch (status) {
		case "paid":
			return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
		case "pending":
			return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
		case "failed":
			return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
		default:
			return "";
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Invoice History
          </h1>
          <p class="text-neutral-600 dark:text-neutral-400">
            View and download your past invoices
          </p>
        </div>
        <Button as-child>
          <NuxtLink to="/account/billing" class="flex items-center gap-2">
            <ArrowLeft :size="16" />
            Back to Billing
          </NuxtLink>
        </Button>
      </div>

      <!-- Invoice Table -->
      <Card class="py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="invoice in invoices" :key="invoice.id">
                <TableCell class="font-mono text-sm font-medium">
                  {{ invoice.id }}
                </TableCell>
                <TableCell>
                  {{ new Date(invoice.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
                </TableCell>
                <TableCell>{{ invoice.description }}</TableCell>
                <TableCell class="font-semibold">
                  ${{ invoice.amount.toFixed(2) }}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" :class="getStatusClass(invoice.status)">
                    {{ invoice.status }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <Button variant="ghost" size="sm" @click="downloadInvoice(invoice.id)">
                    <Download :size="16" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter class="border-t pb-6 bg-neutral-50 dark:bg-neutral-900 rounded-b-xl">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Invoices are generated monthly and sent to your billing email address. You can download them as PDF files.
          </p>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
