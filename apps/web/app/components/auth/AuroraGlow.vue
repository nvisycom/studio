<script setup lang="ts">
/**
 * An ambient, brand-colored aurora for the auth panel: a few soft violet/blue
 * blobs that drift and breathe on a slow loop, blurred into a mesh-gradient
 * glow. Purely decorative (aria-hidden); honours prefers-reduced-motion by
 * holding the blobs still.
 */
</script>

<template>
  <div aria-hidden="true" class="aurora relative size-full">
    <span
      class="aurora-blob aurora-blob--1 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/5"
    />
    <span
      class="aurora-blob aurora-blob--2 bg-gradient-to-tr from-blue-500/12 to-cyan-400/5"
    />
    <span
      class="aurora-blob aurora-blob--3 bg-gradient-to-b from-indigo-500/10 to-violet-500/5"
    />
  </div>
</template>

<style scoped>
.aurora {
	filter: blur(80px);
}

.aurora-blob {
	position: absolute;
	border-radius: 9999px;
	will-change: transform;
}

.aurora-blob--1 {
	top: 8%;
	left: 12%;
	width: 60%;
	height: 60%;
	animation: drift-1 18s ease-in-out infinite;
}

.aurora-blob--2 {
	right: 6%;
	bottom: 10%;
	width: 55%;
	height: 55%;
	animation: drift-2 22s ease-in-out infinite;
}

.aurora-blob--3 {
	left: 30%;
	bottom: 24%;
	width: 45%;
	height: 45%;
	animation: drift-3 26s ease-in-out infinite;
}

@keyframes drift-1 {
	0%,
	100% {
		transform: translate3d(0, 0, 0) scale(1);
	}
	50% {
		transform: translate3d(12%, 8%, 0) scale(1.12);
	}
}

@keyframes drift-2 {
	0%,
	100% {
		transform: translate3d(0, 0, 0) scale(1.05);
	}
	50% {
		transform: translate3d(-14%, -6%, 0) scale(0.92);
	}
}

@keyframes drift-3 {
	0%,
	100% {
		transform: translate3d(0, 0, 0) scale(0.95);
	}
	50% {
		transform: translate3d(8%, -10%, 0) scale(1.1);
	}
}

@media (prefers-reduced-motion: reduce) {
	.aurora-blob {
		animation: none;
	}
}
</style>
