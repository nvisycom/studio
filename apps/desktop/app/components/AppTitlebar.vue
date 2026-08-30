<script setup lang="ts">
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

// The desktop main window uses the macOS "Overlay" title-bar style: the webview
// runs full-height behind the traffic-light buttons. This strip reserves that
// space at the very top of the window (see the `.tauri` title-bar rules in the
// theme CSS) and is the window's drag region. It holds nothing yet.
//
// Rather than rely only on `data-tauri-drag-region` (which hit-tests through the
// DOM and can miss on a fixed element), start the OS drag ourselves on primary
// press, and let a double-click toggle maximize — the two native title-bar
// gestures. Rendered only under Tauri.
const inTauri = isTauri();

async function onPointerDown(event: PointerEvent) {
	// Primary button only; ignore clicks on the traffic-light buttons (the OS
	// draws those on top, but be safe) and modified clicks.
	if (event.button !== 0 || event.detail > 1) return;
	try {
		await getCurrentWindow().startDragging();
	} catch {
		// Not fatal — the region is still a native title bar (double-click works).
	}
}

async function onDoubleClick() {
	try {
		await getCurrentWindow().toggleMaximize();
	} catch {
		// ignore
	}
}
</script>

<template>
  <div
    v-if="inTauri"
    data-tauri-drag-region
    class="fixed inset-x-0 top-0 z-50 h-(--titlebar-height) bg-sidebar"
    @pointerdown="onPointerDown"
    @dblclick="onDoubleClick"
  />
</template>
