<script setup lang="ts">
import type { CreatePolicy, PolicyTemplate } from "@nvisy/sdk/datatypes";
import { ArrowLeft, Loader2, ShieldCheck, Plus, Search } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import { Label } from "#console/components/ui/label";
import {
	Card,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import { toast } from "vue-sonner";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();

useHead({ title: "Policy Templates" });

definePageMeta({
	pageCategory: "header.category.policies",
});

const { createPolicyAsync, isCreating } = usePolicies();

// 0.15 templates are a discriminated union keyed by `kind`, each carrying its
// own settings. We key the gallery + i18n by kind.
type TemplateKind = PolicyTemplate["kind"];
type HipaaMethod = Extract<
	PolicyTemplate,
	{ kind: "hipaa_deidentification" }
>["method"];
type GdprTreatment = Extract<
	PolicyTemplate,
	{ kind: "gdpr_article9" }
>["treatment"];
type PciPart = Extract<PolicyTemplate, { kind: "pci_dss" }>["part"]["part"];
type PciRender = Extract<
	Extract<PolicyTemplate, { kind: "pci_dss" }>["part"],
	{ part: "pan_render" }
>["render"];

const TEMPLATES: { kind: TemplateKind; category: string }[] = [
	{ kind: "hipaa_deidentification", category: "HIPAA" },
	{ kind: "gdpr_article9", category: "GDPR" },
	{ kind: "pci_dss", category: "PCI DSS" },
	{ kind: "ccpa", category: "CCPA" },
];

// Selectable options for each template's settings.
const HIPAA_METHODS: HipaaMethod[] = [
	"safe_harbor",
	"limited_data_set",
	"expert_determination",
];
const GDPR_TREATMENTS: GdprTreatment[] = ["erase", "pseudonymize"];
const PCI_PARTS: PciPart[] = ["pan_render", "sav_erase"];
const PCI_RENDERS: PciRender[] = [
	"truncate",
	"truncate_last_four",
	"hmac_sha256",
	"hmac_sha512",
];

const searchQuery = ref("");

const filteredTemplates = computed(() => {
	const q = searchQuery.value.trim().toLowerCase();
	if (!q) return TEMPLATES;
	return TEMPLATES.filter((tmpl) => {
		const name = t(`policies.templates.${tmpl.kind}.name`).toLowerCase();
		const desc = t(`policies.templates.${tmpl.kind}.description`).toLowerCase();
		return (
			name.includes(q) ||
			desc.includes(q) ||
			tmpl.category.toLowerCase().includes(q)
		);
	});
});

// Name dialog: picking a template opens it to choose a slug, display name, and
// the template's own settings.
const selected = ref<TemplateKind | null>(null);
const slug = ref("");
const slugEdited = ref(false);
const displayName = ref("");

// Per-kind settings (defaults chosen as the most common / safest option).
const hipaaMethod = ref<HipaaMethod>("safe_harbor");
const gdprTreatment = ref<GdprTreatment>("erase");
const pciPart = ref<PciPart>("pan_render");
const pciRender = ref<PciRender>("truncate_last_four");

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function openDialog(kind: TemplateKind) {
	selected.value = kind;
	displayName.value = t(`policies.templates.${kind}.name`);
	slug.value = slugify(displayName.value);
	slugEdited.value = false;
}

watch(displayName, (value) => {
	if (!slugEdited.value) slug.value = slugify(value);
});

function onSlugInput() {
	slugEdited.value = true;
	slug.value = slugify(slug.value);
}

function closeDialog(open: boolean) {
	if (!open) selected.value = null;
}

const isValid = computed(
	() => displayName.value.trim().length >= 3 && slug.value.length > 0,
);

// Assemble the discriminated PolicyTemplate for the selected kind + settings.
function buildTemplate(kind: TemplateKind): PolicyTemplate {
	switch (kind) {
		case "hipaa_deidentification":
			return { kind, method: hipaaMethod.value };
		case "gdpr_article9":
			return { kind, treatment: gdprTreatment.value };
		case "pci_dss":
			return {
				kind,
				part:
					pciPart.value === "pan_render"
						? { part: "pan_render", render: pciRender.value }
						: { part: "sav_erase" },
			};
		default:
			return { kind: "ccpa" };
	}
}

async function create() {
	if (!selected.value || !isValid.value) return;
	const policy: CreatePolicy = {
		slug: slug.value,
		displayName: displayName.value.trim(),
		source: "template",
		template: buildTemplate(selected.value),
	};
	try {
		await createPolicyAsync(policy);
		toast.success(t("policies.toast.created"));
		await navigateTo(wLink("/policies"));
	} catch (error) {
		toast.error(t("policies.toast.createFailed"), {
			description: error instanceof Error ? error.message : undefined,
		});
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="mx-auto w-full max-w-6xl">
      <!-- Header with back button and search -->
      <div
        class="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
      >
        <Button as-child variant="outline" class="font-normal">
          <NuxtLink :to="wLink('/policies')" class="flex items-center gap-2">
            <ArrowLeft :size="16" />
            {{ t("policies.templates.back") }}
          </NuxtLink>
        </Button>

        <div class="relative flex-1">
          <Search
            :size="16"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="searchQuery"
            :placeholder="t('policies.templates.searchPlaceholder')"
            class="h-9 pl-10"
          />
        </div>
      </div>

      <!-- No results -->
      <div
        v-if="filteredTemplates.length === 0"
        class="py-12 text-center"
      >
        <div
          class="mx-auto mb-4 flex size-10 items-center justify-center rounded-lg bg-muted/50"
        >
          <ShieldCheck class="size-5 text-muted-foreground" />
        </div>
        <p class="mb-1 text-sm text-foreground">
          {{ t("policies.templates.noResults") }}
        </p>
        <Button variant="outline" size="sm" @click="searchQuery = ''">
          {{ t("policies.templates.clearSearch") }}
        </Button>
      </div>

      <!-- Template cards grid -->
      <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        <!-- Custom policy card (first, emphasized) -->
        <Card
          v-if="!searchQuery.trim()"
          class="flex flex-col border-neutral-200 transition-all duration-200 hover:scale-[1.02] hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:hover:border-neutral-700"
        >
          <CardHeader class="pb-2">
            <div class="flex items-center gap-3">
              <div
                class="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800"
              >
                <Plus :size="20" class="text-muted-foreground" />
              </div>
              <div class="min-w-0 flex-1">
                <CardTitle class="truncate text-base font-normal">
                  {{ t("policies.templates.scratch.name") }}
                </CardTitle>
                <p
                  class="mt-0.5 truncate text-xs font-normal text-neutral-500 dark:text-neutral-400"
                >
                  {{ t("policies.templates.custom") }}
                </p>
              </div>
            </div>
            <p
              class="mt-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400"
            >
              {{ t("policies.templates.scratch.description") }}
            </p>
          </CardHeader>

          <CardFooter class="mt-auto pt-2">
            <Button as-child class="w-full font-normal">
              <NuxtLink :to="wLink('/policies/new')">
                {{ t("policies.templates.scratchAction") }}
              </NuxtLink>
            </Button>
          </CardFooter>
        </Card>

        <Card
          v-for="template in filteredTemplates"
          :key="template.kind"
          class="flex flex-col border-neutral-200 transition-all duration-200 hover:scale-[1.02] hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:hover:border-neutral-700"
        >
          <CardHeader class="pb-2">
            <div class="flex items-center gap-3">
              <div
                class="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800"
              >
                <ShieldCheck :size="20" class="text-muted-foreground" />
              </div>
              <div class="min-w-0 flex-1">
                <CardTitle class="truncate text-base font-normal">
                  {{ t(`policies.templates.${template.kind}.name`) }}
                </CardTitle>
                <p
                  class="mt-0.5 truncate text-xs font-normal text-neutral-500 dark:text-neutral-400"
                >
                  {{ template.category }}
                </p>
              </div>
            </div>
            <p
              class="mt-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400"
            >
              {{ t(`policies.templates.${template.kind}.description`) }}
            </p>
          </CardHeader>

          <CardFooter class="mt-auto pt-2">
            <Button
              variant="outline"
              class="w-full font-normal"
              @click="openDialog(template.kind)"
            >
              {{ t("policies.templates.use") }}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>

    <!-- Name dialog -->
    <Dialog :open="!!selected" @update:open="closeDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t("policies.templates.dialogTitle") }}</DialogTitle>
          <DialogDescription v-if="selected">
            {{ t(`policies.templates.${selected}.description`) }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div class="space-y-2">
            <Label for="template-name">
              {{ t("policies.templates.nameLabel") }}
            </Label>
            <Input
              id="template-name"
              v-model="displayName"
              :placeholder="t('policies.templates.namePlaceholder')"
            />
          </div>
          <div class="space-y-2">
            <Label for="template-slug">
              {{ t("policies.templates.slugLabel") }}
            </Label>
            <Input
              id="template-slug"
              v-model="slug"
              autocapitalize="none"
              class="font-mono text-sm"
              :placeholder="t('policies.templates.slugPlaceholder')"
              @input="onSlugInput"
            />
            <p class="text-xs text-muted-foreground">
              {{ t("policies.templates.slugHint") }}
            </p>
          </div>

          <!-- HIPAA: de-identification method -->
          <div
            v-if="selected === 'hipaa_deidentification'"
            class="flex items-center justify-between gap-3"
          >
            <Label class="shrink-0">
              {{ t("policies.templates.settings.hipaaMethod") }}
            </Label>
            <Select v-model="hipaaMethod">
              <SelectTrigger class="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="method in HIPAA_METHODS"
                  :key="method"
                  :value="method"
                >
                  {{ t(`policies.templates.settings.hipaaMethods.${method}`) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- GDPR: Article 9 treatment -->
          <div
            v-else-if="selected === 'gdpr_article9'"
            class="flex items-center justify-between gap-3"
          >
            <Label class="shrink-0">
              {{ t("policies.templates.settings.gdprTreatment") }}
            </Label>
            <Select v-model="gdprTreatment">
              <SelectTrigger class="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="treatment in GDPR_TREATMENTS"
                  :key="treatment"
                  :value="treatment"
                >
                  {{
                    t(`policies.templates.settings.gdprTreatments.${treatment}`)
                  }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- PCI DSS: subsection + render approach -->
          <template v-else-if="selected === 'pci_dss'">
            <div class="flex items-center justify-between gap-3">
              <Label class="shrink-0">
                {{ t("policies.templates.settings.pciPart") }}
              </Label>
              <Select v-model="pciPart">
                <SelectTrigger class="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="part in PCI_PARTS"
                    :key="part"
                    :value="part"
                  >
                    {{ t(`policies.templates.settings.pciParts.${part}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div
              v-if="pciPart === 'pan_render'"
              class="flex items-center justify-between gap-3"
            >
              <Label class="shrink-0">
                {{ t("policies.templates.settings.pciRender") }}
              </Label>
              <Select v-model="pciRender">
                <SelectTrigger class="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="render in PCI_RENDERS"
                    :key="render"
                    :value="render"
                  >
                    {{ t(`policies.templates.settings.pciRenders.${render}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </template>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="selected = null">
            {{ t("policies.templates.cancel") }}
          </Button>
          <Button :disabled="!isValid || isCreating" @click="create">
            <Loader2 v-if="isCreating" class="mr-2 h-4 w-4 animate-spin" />
            {{ t("policies.templates.create") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
