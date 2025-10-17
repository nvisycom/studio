<template>
  <footer class="border-t border-border bg-background">
    <div class="flex h-6 items-center justify-between px-4 text-xs text-muted-foreground">
      <!-- Left: System Status -->
      <div class="flex items-center space-x-4">
        <!-- OpenStatus -->
        <div class="flex items-center space-x-1.5">
          <!-- <OpenStatus /> -->
          OpenStatus
        </div>

        <!-- Connection Status -->
        <div class="flex items-center space-x-1">
          <Wifi class="w-3 h-3 text-green-600" />
          <span>Connected</span>
        </div>

        <!-- Activity Indicator -->
        <div class="flex items-center space-x-1">
          <Activity class="w-3 h-3" />
          <span>Ready</span>
        </div>
      </div>

      <!-- Right: Info and Actions -->
      <div class="flex items-center space-x-4">
        <!-- Version -->
        <div class="flex items-center space-x-1">
          <span>v0.1.0</span>
        </div>

        <!-- Memory Usage -->
        <div class="flex items-center space-x-1">
          <HardDrive class="w-3 h-3" />
          <span>128 MB</span>
        </div>

        <!-- Current Time -->
        <div class="flex items-center space-x-1">
          <Clock class="w-3 h-3" />
          <span>{{ currentTime }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// import { OpenStatus } from "@nvisy/shared/components";
import { Wifi, Activity, HardDrive, Clock } from "lucide-vue-next";

// Current time
const currentTime = ref("");

// Update time every second
const updateTime = () => {
	const now = new Date();
	currentTime.value = now.toLocaleTimeString("en-US", {
		hour12: false,
		hour: "2-digit",
		minute: "2-digit",
	});
};

// Initialize time and set up interval
onMounted(() => {
	updateTime();
	const interval = setInterval(updateTime, 1000);

	onUnmounted(() => {
		clearInterval(interval);
	});
});
</script>
