<template>
  <div>
    <!-- Hero Section -->
    <section class="relative py-12 md:py-24 lg:py-32">
      <div class="container px-4 md:px-6">
        <div class="flex flex-col items-center space-y-4 text-center">
          <div class="space-y-2">
            <h1 class="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Welcome to Nvisy
            </h1>
            <p class="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              A modern desktop application built with Vue, Nuxt, and Tauri for seamless cross-platform experiences.
            </p>
          </div>
          <div class="flex gap-4">
            <Button size="lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-12 md:py-24 lg:py-32 bg-muted/50">
      <div class="container px-4 md:px-6">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Key Features
          </h2>
          <p class="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
            Everything you need to build amazing desktop applications
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <Card>
            <CardHeader>
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <CardTitle>Fast Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-muted-foreground">
                Built with Tauri for native performance and minimal resource usage.
              </p>
            </CardContent>
          </Card>

          <!-- Feature 2 -->
          <Card>
            <CardHeader>
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <CardTitle>Cross Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-muted-foreground">
                Deploy to Windows, macOS, and Linux from a single codebase.
              </p>
            </CardContent>
          </Card>

          <!-- Feature 3 -->
          <Card>
            <CardHeader>
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <CardTitle>Modern UI</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-muted-foreground">
                Beautiful, accessible components with dark mode support built-in.
              </p>
            </CardContent>
          </Card>

          <!-- Feature 4 -->
          <Card>
            <CardHeader>
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle>Secure</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-muted-foreground">
                Built-in security with Tauri's secure architecture and sandboxing.
              </p>
            </CardContent>
          </Card>

          <!-- Feature 5 -->
          <Card>
            <CardHeader>
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <CardTitle>Customizable</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-muted-foreground">
                Flexible theming system and component library for your unique needs.
              </p>
            </CardContent>
          </Card>

          <!-- Feature 6 -->
          <Card>
            <CardHeader>
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                </svg>
              </div>
              <CardTitle>Developer Friendly</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-muted-foreground">
                Hot reload, TypeScript support, and excellent developer experience.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-12 md:py-24 lg:py-32">
      <div class="container px-4 md:px-6">
        <div class="flex flex-col items-center space-y-4 text-center">
          <div class="space-y-2">
            <h2 class="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to Get Started?
            </h2>
            <p class="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
              Start building your next desktop application today with Nvisy's modern stack.
            </p>
          </div>
          <div class="flex gap-4">
            <Button size="lg">
              Open Dashboard
            </Button>
            <Button variant="outline" size="lg">
              View Settings
            </Button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@nvisy/shared/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from "@nvisy/shared/ui/card";

// Set page meta
definePageMeta({
	title: "Home - Nvisy",
	description:
		"A modern desktop application built with Vue, Nuxt, and Tauri for seamless cross-platform experiences.",
});

// Set page head
useHead({
	title: "Home - Nvisy",
	meta: [
		{
			name: "description",
			content:
				"A modern desktop application built with Vue, Nuxt, and Tauri for seamless cross-platform experiences.",
		},
	],
});
</script>
