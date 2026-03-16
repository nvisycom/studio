<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Calendar } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { webhookEvents, type WebhookEvent } from "./webhooks";

const events = ref<WebhookEvent[]>([]);
let eventCounter = 0;
let interval: number | null = null;

const formatTime = () => {
	const now = new Date();
	const month = now.toLocaleString("en-US", { month: "short" });
	const day = now.getDate();
	const time = now.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
	return `${month} ${day} ${time}`;
};

const addEvent = () => {
	const template = webhookEvents[eventCounter % webhookEvents.length];
	const newEvent: WebhookEvent = {
		...template,
		id: Date.now(),
		timestamp: formatTime(),
	};

	events.value = [newEvent, ...events.value].slice(0, 3);
	eventCounter++;
};

onMounted(() => {
	addEvent();
	interval = window.setInterval(() => {
		addEvent();
	}, 3500);
});

onUnmounted(() => {
	if (interval) clearInterval(interval);
});
</script>

<template>
  <div
    class="bg-background rounded-xl p-6 h-[280px] relative border border-border/50"
  >
    <div class="space-y-6 relative overflow-hidden h-full">
      <TransitionGroup name="webhook">
        <div v-for="(event, index) in events" :key="event.id" class="relative">
          <!-- Vertical line connector -->
          <div
            v-if="index < events.length - 1"
            class="absolute left-5 w-px bg-border"
            style="top: 50px; bottom: -14px"
          />

          <!-- Top row: Icon, Badge, Date -->
          <div class="flex items-center gap-4 mb-4">
            <div
              class="w-10 h-10 rounded-full bg-accent border border-border/50 flex items-center justify-center flex-shrink-0 z-10"
            >
              <component
                :is="event.icon"
                class="w-5 h-5 text-muted-foreground"
              />
            </div>
            <Badge
              :class="event.eventColor"
              class="text-sm px-3 py-1 transition-all duration-300"
            >
              {{ event.type }}
            </Badge>
            <div
              class="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground"
            >
              <Calendar class="w-3 h-3" />
              <span class="font-mono">{{ event.timestamp }}</span>
            </div>
          </div>

          <!-- Bottom section: Metadata -->
          <div class="ml-14 text-xs text-foreground">
            <!-- uploaded -->
            <div
              v-if="event.type === 'uploaded'"
              class="flex items-center gap-1.5 flex-wrap"
            >
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.filename }}
              </Badge>
              <span class="text-muted-foreground">by</span>
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.author }}
              </Badge>
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.size }}
              </Badge>
            </div>

            <!-- redacted -->
            <div
              v-else-if="event.type === 'redacted'"
              class="flex items-center gap-1.5 flex-wrap"
            >
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.filename }}
              </Badge>
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.version }}
              </Badge>
              <span class="text-muted-foreground">by</span>
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.author }}
              </Badge>
              <span class="text-muted-foreground">redacted</span>
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.fields }} fields
              </Badge>
              <span class="text-muted-foreground">from</span>
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.size }}
              </Badge>
            </div>

            <!-- verified -->
            <div
              v-else-if="event.type === 'verified'"
              class="flex items-center gap-1.5 flex-wrap"
            >
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.filename }}
              </Badge>
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.version }}
              </Badge>
              <span class="text-muted-foreground">by</span>
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.author }}
              </Badge>
              <span class="text-muted-foreground">in</span>
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.duration }}
              </Badge>
            </div>

            <!-- downloaded -->
            <div
              v-else-if="event.type === 'downloaded'"
              class="flex items-center gap-1.5 flex-wrap"
            >
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.filename }}
              </Badge>
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.version }}
              </Badge>
              <span class="text-muted-foreground">by</span>
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ event.author }}
              </Badge>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- Fade effect at the bottom -->
      <div
        class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-10"
      />
    </div>
  </div>
</template>

<style scoped>
.webhook-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.webhook-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.webhook-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
}

.webhook-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.webhook-move {
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
