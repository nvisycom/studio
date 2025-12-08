<script setup lang="ts">
import { computed } from "vue";
import { ChevronDown, Slash } from "lucide-vue-next";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const route = useRoute();
const router = useRouter();

interface DropdownOption {
	label: string;
	value: string;
}

interface BreadcrumbItemType {
	label: string;
	href?: string;
	dropdown?: DropdownOption[];
}

interface Props {
	currentProject?: { name: string };
	currentUser?: { name: string; username: string };
}

const props = withDefaults(defineProps<Props>(), {
	currentProject: () => ({ name: "Production App" }),
	currentUser: () => ({ name: "John Doe", username: "johndoe" }),
});

const breadcrumbs = computed<BreadcrumbItemType[]>(() => {
	// Default breadcrumbs from page meta
	const metaBreadcrumbs =
		(route.meta.breadcrumbs as BreadcrumbItemType[]) || [];

	return metaBreadcrumbs.map((crumb, index) => {
		// Replace [project] with project name
		if (crumb.label === "[project]") {
			return { ...crumb, label: props.currentProject.name, href: "/" };
		}

		// Replace [account] with username
		if (crumb.label === "[account]") {
			return { ...crumb, label: props.currentUser.username, href: "/account" };
		}

		return crumb;
	});
});

function handleDropdownSelect(option: DropdownOption) {
	// Navigate to the path directly
	router.push(option.value);
}
</script>

<template>
  <Breadcrumb>
    <BreadcrumbList>
      <template v-for="(item, index) in breadcrumbs" :key="index">
        <BreadcrumbSeparator v-if="index > 0">
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <!-- Dropdown breadcrumb item -->
          <DropdownMenu v-if="item.dropdown">
            <DropdownMenuTrigger class="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors">
              {{ item.label }}
              <ChevronDown class="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                v-for="option in item.dropdown"
                :key="option.value"
                @click="handleDropdownSelect(option)"
              >
                {{ option.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Regular link breadcrumb item -->
          <BreadcrumbLink v-else-if="item.href && index < breadcrumbs.length - 1" :href="item.href">
            {{ item.label }}
          </BreadcrumbLink>

          <!-- Current page breadcrumb item -->
          <BreadcrumbPage v-else>
            {{ item.label }}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>
