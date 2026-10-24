<script setup lang="ts">
import { ChevronDown, Pencil, Plus } from "@lucide/vue";
import ReviewSidebar from "../../reviews/detail/ReviewSidebar.vue";
import ReviewTimeline from "../../reviews/detail/ReviewTimeline.vue";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";

/**
 * The full-screen review: the same wide two-column layout as the standalone
 * review page ({@link ReviewTimeline} + {@link ReviewSidebar}), driven by the
 * studio's review selection. Shares all its logic with the narrow inspector tab
 * ({@link StudioReview}) via {@link useStudioReview}, so the two never drift.
 */
const { t } = useI18n();

const props = defineProps<{
	documentId: string | null;
	documentName?: string | null;
	detectionId: string | null;
}>();

const {
	reviews,
	isLoadingReviews,
	selectedReviewId,
	review,
	timeline,
	isLoadingTimeline,
	accountId,
	isCreating,
	isRenaming,
	openReview,
	renameReview,
	addReviewer,
	removeReviewer,
	onSubmit,
	onApprove,
	onRequestChanges,
	onReopen,
	onComment,
	onEditComment,
	onDeleteComment,
} = useStudioReview({
	documentId: () => props.documentId,
	documentName: () => props.documentName,
	detectionId: () => props.detectionId,
});

// Inline rename of the open review's title.
const isEditingTitle = ref(false);
const titleDraft = ref("");
function startEditTitle() {
	titleDraft.value = review.value?.displayName ?? "";
	isEditingTitle.value = true;
}
async function saveTitle() {
	const next = titleDraft.value.trim();
	if (next && next !== review.value?.displayName) await renameReview(next);
	isEditingTitle.value = false;
}
</script>

<template>
	<div class="flex h-full min-h-0 flex-col overflow-y-auto">
		<div class="mx-auto w-full max-w-5xl flex-1 p-6">
			<!-- Header: the review's name (editable), the review switcher, and New. -->
			<div class="mb-4 flex flex-col gap-2">
				<!-- Title: the open review's name, editable inline. -->
				<div v-if="review" class="group/title flex items-center gap-2">
					<form
						v-if="isEditingTitle"
						class="flex min-w-0 flex-1 items-center gap-1.5"
						@submit.prevent="saveTitle"
					>
						<Input
							v-model="titleDraft"
							autofocus
							class="h-9 text-lg font-semibold"
							:maxlength="255"
							@blur="saveTitle"
							@keydown.esc="isEditingTitle = false"
						/>
					</form>
					<template v-else>
						<h2 class="min-w-0 truncate text-lg font-semibold">
							{{ review.displayName }}
						</h2>
						<Button
							variant="ghost"
							size="icon"
							class="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/title:opacity-100"
							:disabled="isRenaming"
							:aria-label="t('studio.detections.review.rename')"
							@click="startEditTitle"
						>
							<Pencil :size="14" />
						</Button>
					</template>
				</div>

				<!-- Switcher (pick among the document's reviews) + New. -->
				<div class="flex items-center gap-2">
					<DropdownMenu v-if="reviews.length">
						<DropdownMenuTrigger as-child>
							<Button variant="outline" size="sm" class="gap-1.5">
								<span class="max-w-xs truncate">
									{{
										review?.displayName ?? t("studio.detections.review.select")
									}}
								</span>
								<ChevronDown :size="14" class="shrink-0 text-muted-foreground" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" class="min-w-64">
							<DropdownMenuItem
								v-for="r in reviews"
								:key="r.id"
								@select="selectedReviewId = r.id"
							>
								<span class="min-w-0 flex-1 truncate">{{ r.displayName }}</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<span v-else class="text-sm text-muted-foreground">
						{{ t("studio.detections.review.none") }}
					</span>
					<Button
						size="sm"
						variant="outline"
						class="gap-1.5"
						:disabled="!documentId || isCreating"
						@click="openReview"
					>
						<Plus :size="15" />
						{{ t("studio.detections.review.new") }}
					</Button>
				</div>
			</div>

			<!-- Empty state. -->
			<div
				v-if="!reviews.length && !isLoadingReviews"
				class="flex min-h-40 items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground"
			>
				{{ t("studio.detections.review.startHint") }}
			</div>

			<!-- Two-column: the wide timeline + the review sidebar. -->
			<div
				v-else-if="review"
				class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_240px]"
			>
				<div class="min-w-0">
					<ReviewTimeline
						:entries="timeline"
						:loading="isLoadingTimeline"
						:current-account-id="accountId"
						:on-comment="onComment"
						:on-edit-comment="onEditComment"
						:on-delete-comment="onDeleteComment"
					/>
				</div>
				<ReviewSidebar
					:review="review"
					@submit="onSubmit"
					@approve="onApprove"
					@request-changes="onRequestChanges"
					@reopen="onReopen"
					@assign="addReviewer"
					@unassign="removeReviewer"
				/>
			</div>
		</div>
	</div>
</template>
