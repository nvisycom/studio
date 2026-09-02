<script setup lang="ts">
// biome-ignore-all lint/suspicious/noExplicitAny: SuperDoc's extension ctx and anchor/decoration surfaces are broadly typed; we touch a narrow, guarded slice.
import type { TextEntityView } from "#console/composables/useTextEntities";
import type { AddTextEntityInput } from "#console/composables/useStudioRedaction";
import type { StudioViewPhase } from "#console/composables/useStudioView";

/**
 * Read-only Word (.docx) preview with detected-entity highlighting. One of the
 * studio views (see the shared contract in `useStudioView`); it reports its
 * loading phase (`downloading` -> `rendering` -> `ready`) so the host shows a
 * single loader.
 *
 * Rendered by SuperDoc in `viewing` mode — a real DOCX layout engine, so
 * pagination, sections, and even/odd headers/footers render faithfully (unlike a
 * plain HTML conversion). Detected entities are highlighted through SuperDoc's
 * decoration API: we locate each entity's text in the document (`doc.query.match`)
 * and paint the matches with the shared entity-chip styling, keyed on category /
 * suppressed / active state.
 *
 * SuperDoc is heavy, so it's dynamically imported the first time a DOCX opens.
 *
 * NOTE: the reviewer "add entity by selecting text" flow is not wired here yet.
 * It needs a mapping from a SuperDoc selection back to a raw `document.xml` byte
 * span (what the redaction apply path consumes); that lands in a follow-up. The
 * `canAdd` prop and `add-text-entity` emit are kept so the parent contract is stable.
 */
// The studio-view contract, declared locally (Vue's defineProps/defineEmits
// macros can't resolve a type imported through the `#console` alias as their
// whole generic — a compiler-sfc limitation — but they resolve a *local*
// interface, and aliased types referenced *inside* it, fine). Mirrors the shared
// `StudioViewProps`/`StudioViewEmits` in `useStudioView`.
interface Props {
	/** Blob object URL of the .docx file, or null when nothing is open. */
	contentUrl: string | null;
	/** Detected entities to highlight (matched by their text). */
	entities?: TextEntityView[];
	/** Currently focused entity id, for the active style + scroll-into-view. */
	activeEntityId?: string | null;
	/** Whether the reviewer may add entities by selecting text (deferred). */
	canAdd?: boolean;
}
interface Emits {
	"focus-entity": [id: string];
	"add-text-entity": [payload: AddTextEntityInput];
	/** Loading phase, so the host shows the single loader/error. */
	phase: [phase: StudioViewPhase];
}
const props = withDefaults(defineProps<Props>(), {
	entities: () => [],
	activeEntityId: null,
	canAdd: false,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();

const container = ref<HTMLElement | null>(null);

// The live SuperDoc instance and a `refresh` hook the highlight extension exposes
// once it's active, so the component can re-apply highlights without re-mounting.
// The *desired* highlight state lives in these component-scoped refs (the single
// source of truth); the extension reads them via getters, so entities that arrive
// before the extension is ready (detection results load async after mount) still
// paint on the first `onReady`. SuperDoc's public types are broad, so the
// instance is narrowly typed.
let superdoc: { destroy?: () => void } | null = null;
// Rebuild all highlights (re-run the entity->anchor matching). Costly, so only
// called when the entity set or the file changes.
let refreshHighlights: (() => void) | null = null;
// Re-apply just the active-entity state (repaint the `--active` class + scroll),
// without re-matching. Called when only `activeEntityId` changes.
let applyActive: (() => void) | null = null;
// Pending repaint timers, cleared on teardown so a torn-down instance is never
// invalidated (which would throw uncaught in the timer callback).
let repaintTimers: ReturnType<typeof setTimeout>[] = [];
// Generation guard for the async highlight rebuild. `rebuild` awaits several
// times (story enumeration + one `query.match` per entity per story), so two
// rebuilds can overlap — a new entity set arriving mid-rebuild, or the entity
// watcher racing `onReady`. Each rebuild captures the generation at its start;
// a newer rebuild (or teardown) bumps it, and the older one bails after its next
// `await` instead of replacing anchors with stale matches or scheduling repaints
// against a torn-down instance.
let highlightGeneration = 0;
let desiredEntities: TextEntityView[] = [];
let desiredActiveId: string | null = null;

/** The class the shared entity styling targets (see assets/css/entities.css). */
const CHIP_CLASS = "docx-chip";

async function render(url: string, target: HTMLElement) {
	teardown();
	emit("phase", { status: "downloading" });
	try {
		// Dynamic import: SuperDoc is large, so it only loads when a DOCX opens.
		const [{ SuperDoc, defineSuperDocExtension }] = await Promise.all([
			import("superdoc"),
			import("superdoc/style.css"),
		]);
		if (props.contentUrl !== url || container.value !== target) return;

		// Fetch the DOCX bytes and wrap them in a real `File` — SuperDoc keys off
		// the name/extension (and MIME type) to recognize a .docx, so a bare Blob
		// from a blob: URL (no name) is not enough.
		const bytes = await (await fetch(url)).arrayBuffer();
		if (props.contentUrl !== url || container.value !== target) return;
		const file = new File([bytes], "document.docx", {
			type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		});
		// Bytes in hand; SuperDoc now lays the document out (the slow phase).
		emit("phase", { status: "rendering" });

		// The highlight extension owns an anchor collection + a decoration provider
		// (SuperDoc's supported pattern). It reads the *desired* highlight state from
		// the component-scoped `desiredEntities` / `desiredActiveId` refs — the single
		// source of truth — so entities that arrive before the extension is ready
		// (detection loads async after mount) still paint on the first `onReady`.
		const HighlightExtension = defineSuperDocExtension({
			id: "studio.entities",
			storage: () => ({}),
			activate(ctx: any) {
				const anchors = ctx.anchors.collection("studio.entities");
				// Anchor id -> its entity, so the decoration provider can style each
				// match by category / suppressed / active.
				const byAnchor = new Map<string, TextEntityView>();

				ctx.decorations.register({
					id: "studio.entities",
					provide: ({ visible }: any) => {
						return anchors
							.visibleIn(visible)
							.map((anchor: any) => {
								const entity = byAnchor.get(anchor.id);
								if (!entity) return null;
								// Style via classes, not data-* attributes: SuperDoc paints the
								// decoration's `className` reliably, whereas its `data` payload
								// does not surface as the `data-category`/`data-suppressed` DOM
								// attributes entities.css keys off. The category class carries
								// the hue (see the docx-chip category rules in entities.css); the
								// entity id rides along as data (for click -> focus, read via
								// closest()).
								return {
									type: "text",
									anchor,
									// Everything the DOM needs rides in the className, since
									// SuperDoc paints `className` reliably but its `data` payload
									// does not surface as DOM attributes. The category class drives
									// the hue (entities.css); the `docx-eid-<id>` class carries the
									// entity id for click -> focus (entity ids are UUIDs, safe as
									// class tokens).
									className: [
										CHIP_CLASS,
										`docx-cat-${entity.category ?? "none"}`,
										`docx-eid-${entity.id}`,
										entity.id === desiredActiveId
											? `${CHIP_CLASS}--active`
											: "",
										entity.suppressed ? `${CHIP_CLASS}--suppressed` : "",
									]
										.filter(Boolean)
										.join(" "),
								};
							})
							.filter(Boolean);
					},
				});

				// The stories to search: the body plus every header/footer part. By
				// default `query.match` only searches the body (`in` omitted), so
				// header/footer entities would be missed; we enumerate the doc's
				// header/footer parts (async) and search each one too.
				const storiesToSearch = async (): Promise<
					({ in?: unknown } | undefined)[]
				> => {
					const stories: ({ in?: unknown } | undefined)[] = [undefined]; // body
					try {
						const listed = await ctx.doc.headerFooters?.parts?.list?.();
						for (const part of listed?.items ?? []) {
							stories.push({
								in: {
									kind: "story",
									storyType: "headerFooterPart",
									refId: part.refId,
								},
							});
						}
					} catch {
						// Header/footer enumeration unavailable — body-only is still valid.
					}
					return stories;
				};

				// Locate each desired entity's text across all stories and anchor every
				// match (all matches of an entity share its styling), then repaint.
				// Async and re-entrant: a newer rebuild (or teardown) bumps
				// `highlightGeneration`, so this one bails after its next `await` rather
				// than replacing anchors with stale matches or scheduling repaints against
				// a torn-down instance.
				const rebuild = async () => {
					const generation = ++highlightGeneration;
					const isCurrent = () => generation === highlightGeneration;
					const next: any[] = [];
					const nextByAnchor = new Map<string, TextEntityView>();
					const stories = await storiesToSearch();
					if (!isCurrent()) return;
					for (const entity of desiredEntities) {
						if (!entity.text) continue;
						for (const story of stories) {
							try {
								const result = await ctx.doc.query.match({
									select: { type: "text", pattern: entity.text },
									...(story ?? {}),
								});
								// A rebuild that started later has superseded us; drop these
								// (now stale) matches instead of racing it to `anchors.replace`.
								if (!isCurrent()) return;
								for (const item of result?.items ?? []) {
									const anchor = ctx.anchors.from(item.target);
									nextByAnchor.set(anchor.id, entity);
									next.push(anchor);
								}
							} catch {
								// A single entity/story that can't be located is skipped.
							}
						}
					}
					// Publish atomically: the anchor->entity map and the anchor set are
					// swapped together only once we know this rebuild is still current, so
					// the decoration provider never sees a half-updated pair.
					byAnchor.clear();
					for (const [id, entity] of nextByAnchor) byAnchor.set(id, entity);
					anchors.replace(next);
					ctx.decorations.invalidate("studio.entities");
					// A decoration only paints for anchors in the currently-visible range,
					// and right after a rebuild that range is often still empty (pages
					// paginate asynchronously). Re-invalidate a few times over the next
					// moment so `provide` re-runs once the pages have painted — bounded, so
					// it can't loop. Each fire re-checks the generation, so a timer that
					// outlives its rebuild (a newer one, or teardown) is a no-op; teardown
					// also clears them.
					for (const delay of [50, 200, 500, 1000]) {
						repaintTimers.push(
							setTimeout(() => {
								if (generation === highlightGeneration)
									ctx.decorations.invalidate("studio.entities");
							}, delay),
						);
					}
				};

				// Scroll the active entity's first match into view (after a repaint).
				const scrollToActive = () => {
					if (!desiredActiveId) return;
					requestAnimationFrame(() => {
						target
							.querySelector(`.${CHIP_CLASS}--active`)
							?.scrollIntoView({ block: "center", behavior: "smooth" });
					});
				};

				// Full rebuild (re-match every entity) — for entity-set / file changes.
				refreshHighlights = () => {
					void rebuild().then(scrollToActive);
				};

				// Active-only update — the anchor set doesn't depend on the focused
				// entity, only the `--active` class does, so just repaint + scroll
				// instead of re-matching the whole document on every focus step.
				applyActive = () => {
					ctx.decorations.invalidate("studio.entities");
					scrollToActive();
				};

				// Paint once the document is ready — reads whatever desired state has
				// arrived by then (possibly after several prop updates). Pages paginate
				// asynchronously after `ready`, so also re-provide on paint: a
				// decoration only renders for ranges in a painted region, and the
				// initial `visibleIn` is empty until the first page paints.
				ctx.onReady(() => {
					// Document is on screen — the host drops its loader.
					emit("phase", { status: "ready" });
					void rebuild();
				});
				ctx.onPaint?.(() => {
					ctx.decorations.invalidate("studio.entities");
				});
			},
		});

		target.replaceChildren();
		target.id =
			target.id || `studio-docx-${Math.random().toString(36).slice(2)}`;
		superdoc = new SuperDoc({
			selector: `#${target.id}`,
			document: file,
			documentMode: "viewing",
			// Read-only preview: hyperlinks must not navigate (a click should focus
			// the entity, not open a mail/web target).
			hyperlinks: false,
			// Disable SuperDoc's built-in loading overlay — the parent preview shows a
			// single loader and keeps it up until we emit `rendered` on `onReady`
			// (SuperDoc's own docs prescribe exactly this handoff when `ui.loading` is
			// off: keep your loader until onReady).
			ui: { loading: false },
			extensions: [HighlightExtension],
		}) as { destroy?: () => void };
	} catch (error) {
		if (props.contentUrl === url) {
			teardown();
			// Release the host's loader even on failure, so it doesn't hang.
			emit("phase", {
				status: "error",
				message: getErrorMessage(error, t("studio.preview.docxFailed")),
			});
		}
		console.error("[studio-docx] SuperDoc render failed", error);
	}
}

function teardown() {
	// Invalidate any in-flight rebuild: bumping the generation makes it bail at its
	// next `await` (before touching the destroyed instance) and turns any repaint
	// timer that outlives this teardown into a no-op.
	highlightGeneration++;
	// Cancel any pending repaint timers before dropping the instance — a fired
	// timer would call `invalidate` on a destroyed SuperDoc and throw uncaught.
	for (const id of repaintTimers) clearTimeout(id);
	repaintTimers = [];
	try {
		superdoc?.destroy?.();
	} catch {
		// best-effort
	}
	superdoc = null;
	refreshHighlights = null;
	applyActive = null;
}

// Keep the desired highlight state in sync with props, and repaint if the
// extension is already live. If it isn't yet (mount in flight), the update is
// still recorded in the refs, so `onReady` picks it up.
watch(
	() => props.entities,
	(entities) => {
		desiredEntities = entities;
		refreshHighlights?.();
	},
	{ deep: true, immediate: true },
);
watch(
	() => props.activeEntityId,
	(id) => {
		desiredActiveId = id ?? null;
		// Only the active class + scroll change — no need to re-match every entity.
		applyActive?.();
	},
	{ immediate: true },
);

// Clicks on a highlight bubble up as focus-entity (decorations are painted
// outside Vue's template, so delegate). The entity id is encoded in a
// `docx-eid-<id>` class on the decoration (SuperDoc surfaces the class, not the
// data payload), so read it back from the class list.
function onClick(event: MouseEvent) {
	const targetEl = event.target as HTMLElement;
	// Read-only preview: a click never navigates, even on a hyperlink entity.
	if (targetEl.closest("a[href]")) event.preventDefault();
	const el = targetEl.closest<HTMLElement>(`.${CHIP_CLASS}`);
	const id = [...(el?.classList ?? [])]
		.find((c) => c.startsWith("docx-eid-"))
		?.slice("docx-eid-".length);
	if (id) emit("focus-entity", id);
}

// Render whenever the file (or the container, after mount) changes.
watch(
	[() => props.contentUrl, container],
	([url, target]) => {
		if (!target) return;
		if (!url) {
			teardown();
			emit("phase", { status: "idle" });
			return;
		}
		render(url, target);
	},
	{ immediate: true },
);

onBeforeUnmount(teardown);
</script>

<template>
  <div class="studio-docx-canvas relative h-full overflow-auto">
    <!-- The SuperDoc mount target is ALWAYS present (never behind v-if), so the
         instance mounts into a live element. SuperDoc sizes its own paginated
         surface, so the target grows to content (the canvas above scrolls); a
         min-height keeps it measurable at mount. Loading and error UI are owned
         by the host, driven by the `phase` events this view emits. -->
    <div ref="container" class="studio-docx min-h-full w-full" @click="onClick" />
  </div>
</template>

<style scoped>
/* SuperDoc paints its own layout (pages on a backdrop). Tint the backdrop to the
   app's content surface so the canvas matches the rest of the studio, and add
   breathing room above the first page / below the last (SuperDoc butts the page
   against the container edge otherwise). */
.studio-docx :deep(.superdoc-layout) {
  background: var(--background);
  /* SuperDoc sets the layout's padding inline, so `!important` is needed to add
     breathing room above the first page / below the last. */
  padding-block: 2rem !important;
}

/* Center the pages horizontally. SuperDoc's root (`.superdoc`) is a flex row
   whose page column is page-width and left-aligns when the container is wider;
   center it. */
.studio-docx :deep(.superdoc) {
  justify-content: center;
}

/* Read-only preview: neutralize the live-link chrome (blue + underline) on
   hyperlinks, keeping the text — our own entity chip is the only marker. Clicks
   are handled by `onClick` below (it prevents navigation), so links stay
   pointer-interactive: an entity that IS a link must remain clickable to focus. */
.studio-docx :deep(a[href]) {
  color: inherit !important;
  text-decoration: none !important;
}

/* In dark mode the default light scrollbar glares against the dark backdrop. */
:global(.dark) .studio-docx-canvas {
  scrollbar-color: var(--border) transparent;
}

/* Entity-chip styling (the `.docx-chip` marker) is shared and lives in
   assets/css/entities.css so every preview stays consistent. */
</style>
