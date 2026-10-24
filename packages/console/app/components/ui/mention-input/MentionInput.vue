<script setup lang="ts">
import { Sparkles } from "@lucide/vue";
import EntityAvatar from "#console/components/avatar/EntityAvatar.vue";

/**
 * A comment input with `@`-mentions. The editor is a contenteditable surface
 * where a picked mention becomes a non-editable chip; typing `@` opens a
 * dropdown of {@link MentionCandidate}s (a special one, like the assistant, can
 * be pinned on top). The model is **plain text** — a chip serializes back to
 * `@username`, which is exactly what the server parses — so a consumer never
 * deals with the chip DOM.
 */
export interface MentionCandidate {
	/** The handle inserted as `@username` and matched while typing. */
	username: string;
	/** Display name shown in the dropdown + chip. */
	name: string;
	avatarUrl?: string | null;
	/** Pins it to the top with a distinct style (e.g. the AI assistant). */
	special?: boolean;
}

const props = withDefaults(
	defineProps<{
		candidates: MentionCandidate[];
		placeholder?: string;
		disabled?: boolean;
	}>(),
	{ placeholder: "" },
);

// The model is the serialized plain text (text + `@username` tokens).
const model = defineModel<string>({ default: "" });

const emit = defineEmits<{
	// Plain Enter (menu closed) — the consumer decides whether to submit. Shift+
	// Enter inserts a newline instead.
	submit: [];
}>();

const editor = ref<HTMLElement | null>(null);
const empty = ref(true);

// The active `@`-query dropdown: the text after `@` and where to anchor the menu.
const query = ref<string | null>(null);
const menuPos = reactive({ left: 0, top: 0 });
const activeIndex = ref(0);

const byName = (c: MentionCandidate) => c.name.toLowerCase();
const filtered = computed<MentionCandidate[]>(() => {
	if (query.value === null) return [];
	const q = query.value.toLowerCase();
	const list = props.candidates.filter(
		(c) => !q || c.username.toLowerCase().includes(q) || byName(c).includes(q),
	);
	// Special candidates (assistant) first, then by name.
	return list
		.slice()
		.sort(
			(a, b) =>
				Number(b.special ?? false) - Number(a.special ?? false) ||
				byName(a).localeCompare(byName(b)),
		)
		.slice(0, 8);
});
const menuOpen = computed(
	() => query.value !== null && filtered.value.length > 0,
);

// A mention chip element for a candidate (non-editable, carries its username).
function chipEl(c: MentionCandidate): HTMLSpanElement {
	const span = document.createElement("span");
	span.dataset.mention = c.username;
	span.contentEditable = "false";
	span.className =
		"mx-0.5 inline-flex items-center rounded bg-primary/10 px-1 text-primary";
	span.textContent = `@${c.name}`;
	return span;
}

// Block-level tags the browser may insert (Enter, pasted markup): each starts a
// new line when serialized.
const BLOCK_TAGS = new Set(["DIV", "P", "LI", "BLOCKQUOTE", "PRE"]);

/** Serialize a node subtree to plain text: mention chips → `@username`, `<br>`
 *  and block boundaries → newlines. Recurses so nested wrappers (the `<div>`s
 *  contenteditable inserts on Enter) don't flatten chips to their display text. */
function serializeNode(node: Node): string {
	if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
	if (!(node instanceof HTMLElement)) return "";
	if (node.dataset.mention !== undefined) return `@${node.dataset.mention}`;
	if (node.tagName === "BR") return "\n";
	let out = "";
	for (const child of node.childNodes) out += serializeNode(child);
	// A block element ends its line, unless the text already does.
	if (BLOCK_TAGS.has(node.tagName) && out && !out.endsWith("\n")) out += "\n";
	return out;
}

/** Serialize the editor's contents to plain text. */
function serialize(): string {
	const root = editor.value;
	if (!root) return "";
	let out = "";
	for (const node of root.childNodes) out += serializeNode(node);
	// A trailing newline from the last block is an artifact of the wrapper, not
	// something the user typed.
	return out.replace(/\n$/, "");
}

function syncModel() {
	const text = serialize();
	model.value = text;
	empty.value = text.trim().length === 0;
}

// Read the `@word` immediately before the caret, if any — the live mention query.
function readQuery() {
	const sel = window.getSelection();
	if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) {
		query.value = null;
		return;
	}
	const range = sel.getRangeAt(0);
	const node = range.startContainer;
	if (node.nodeType !== Node.TEXT_NODE) {
		query.value = null;
		return;
	}
	const text = (node.textContent ?? "").slice(0, range.startOffset);
	// `@` starting a word (start of text or after whitespace), then word chars.
	const match = /(?:^|\s)@([\w.-]*)$/.exec(text);
	if (!match) {
		query.value = null;
		return;
	}
	query.value = match[1] ?? "";
	activeIndex.value = 0;
	// Position on the next frame: on the FIRST character typed into an empty
	// editable, the just-inserted text isn't laid out yet when `@input` fires, so
	// measuring the caret now gives a stale/default rect (the menu lands mid-box).
	// A frame later the layout is flushed and the caret rect is correct. Re-read
	// the live range inside the callback so it reflects the settled DOM.
	requestAnimationFrame(() => {
		const s = window.getSelection();
		if (query.value !== null && s && s.rangeCount > 0)
			positionMenu(s.getRangeAt(0));
	});
}

// Anchor the dropdown just below the caret, in the editor's coordinate space.
// A collapsed caret range has no reliable rect (and after typing a bare `@` into
// an otherwise-empty editable the caret may even be an element-range, not a text
// one), so measure a throwaway zero-width marker placed at the caret — that
// always has a real rect. The marker is inserted, measured and removed within
// this call, and the caret is saved/restored around it, so neither the caret nor
// the serialized text is affected.
function positionMenu(range: Range) {
	const host = editor.value?.getBoundingClientRect();
	if (!host) return;
	// Measure the character just before the caret (the `@` we matched) and anchor
	// to its right edge — a collapsed range's own rect is unreliable, but a
	// one-char range always has a real rect. No DOM mutation, so the caret and the
	// serialized text are untouched. (Called post-layout via rAF, so the rect is
	// current.)
	const node = range.startContainer;
	const offset = range.startOffset;
	if (node.nodeType === Node.TEXT_NODE && offset > 0) {
		const charRange = document.createRange();
		charRange.setStart(node, offset - 1);
		charRange.setEnd(node, offset);
		const rect = charRange.getClientRects()[0];
		if (rect) {
			menuPos.left = rect.right - host.left;
			menuPos.top = rect.bottom - host.top + 4;
			return;
		}
	}
	const fallback = range.getClientRects()[0];
	if (!fallback) return;
	menuPos.left = fallback.left - host.left;
	menuPos.top = fallback.bottom - host.top + 4;
}

// Replace the active `@query` before the caret with a mention chip + a space.
function pick(c: MentionCandidate) {
	const sel = window.getSelection();
	if (!sel || sel.rangeCount === 0) return;
	const range = sel.getRangeAt(0);
	const node = range.startContainer;
	if (node.nodeType !== Node.TEXT_NODE) return;
	const before = (node.textContent ?? "").slice(0, range.startOffset);
	const at = before.lastIndexOf("@");
	if (at < 0) return;
	// Split the text node so the `@query` slice can be swapped for the chip.
	const textNode = node as Text;
	const after = (textNode.textContent ?? "").slice(range.startOffset);
	textNode.textContent = before.slice(0, at);
	const chip = chipEl(c);
	const space = document.createTextNode(" ");
	const tail = document.createTextNode(after);
	textNode.after(chip, space, tail);
	// Caret after the inserted space.
	const r = document.createRange();
	r.setStart(space, 1);
	r.collapse(true);
	sel.removeAllRanges();
	sel.addRange(r);
	query.value = null;
	syncModel();
}

function onInput() {
	syncModel();
	readQuery();
}
function onKeydown(event: KeyboardEvent) {
	// Mid-IME composition: Enter confirms the composed text, it must not submit or
	// drive the mention menu. (keyCode 229 covers browsers that don't set
	// isComposing on the confirming keydown.)
	if (event.isComposing || event.keyCode === 229) return;
	if (!menuOpen.value) {
		// Menu closed: plain Enter submits (the consumer decides what that means);
		// Shift+Enter falls through to insert a newline. Preventing the default
		// keeps the browser from wrapping lines in block `<div>`s, which would break
		// serialization.
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			emit("submit");
		}
		return;
	}
	if (event.key === "ArrowDown") {
		event.preventDefault();
		activeIndex.value = (activeIndex.value + 1) % filtered.value.length;
	} else if (event.key === "ArrowUp") {
		event.preventDefault();
		activeIndex.value =
			(activeIndex.value - 1 + filtered.value.length) % filtered.value.length;
	} else if (event.key === "Enter" || event.key === "Tab") {
		event.preventDefault();
		const c = filtered.value[activeIndex.value];
		if (c) pick(c);
	} else if (event.key === "Escape") {
		query.value = null;
	}
}

// Clear the editor when the model is reset to empty by the parent (e.g. after a
// successful submit), without stomping the user's in-progress text.
watch(model, (value) => {
	if (!value && editor.value && serialize() !== "") {
		editor.value.textContent = "";
		empty.value = true;
	}
});

/** Focus the editor (for the parent). */
function focus() {
	editor.value?.focus();
}
defineExpose({ focus });
</script>

<template>
  <div class="relative">
    <div
      ref="editor"
      role="textbox"
      :contenteditable="!disabled"
      :data-placeholder="placeholder"
      class="relative min-h-[72px] w-full whitespace-pre-wrap break-words rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      :class="empty ? 'before:pointer-events-none before:absolute before:left-3 before:top-2 before:text-muted-foreground before:content-[attr(data-placeholder)]' : ''"
      @input="onInput"
      @keydown="onKeydown"
      @blur="() => (query = null)"
    />

    <!-- The @-mention dropdown, anchored below the caret. -->
    <div
      v-if="menuOpen"
      class="absolute z-50 w-60 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
      :style="{ left: `${menuPos.left}px`, top: `${menuPos.top}px` }"
    >
      <template v-for="(c, i) in filtered" :key="c.username">
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
          :class="i === activeIndex ? 'bg-accent text-accent-foreground' : ''"
          @mousedown.prevent="pick(c)"
          @mouseenter="activeIndex = i"
        >
          <!-- Match EntityAvatar size="sm" (size-6) so the name column lines up
               whether the row shows a sparkle or a real avatar. -->
          <span
            v-if="c.special"
            class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <Sparkles :size="14" />
          </span>
          <EntityAvatar
            v-else
            size="sm"
            :name="c.name"
            :src="c.avatarUrl ?? undefined"
          />
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate">{{ c.name }}</span>
            <span class="truncate text-xs text-muted-foreground">
              @{{ c.username }}
            </span>
          </span>
        </button>
      </template>
    </div>
  </div>
</template>
