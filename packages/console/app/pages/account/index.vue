<script setup lang="ts">
// Static redirect: /account has no page of its own, so send it to the general
// tab before the route resolves (definePageMeta.redirect runs before navigation
// guards and before this page would mount).
definePageMeta({
	pageCategory: "header.category.settings",
	redirect: "/account/general",
});
</script>

<template>
  <div />
</template>
