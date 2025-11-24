<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
  FileText,
  CheckCircle,
  Upload,
  Download,
  Calendar,
  Shield,
} from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import type { FunctionalComponent } from "vue";

interface UploadedEvent {
  type: "uploaded";
  icon: FunctionalComponent;
  eventColor: string;
  filename: string;
  author: string;
  size: string;
}

interface RedactedEvent {
  type: "redacted";
  icon: FunctionalComponent;
  eventColor: string;
  filename: string;
  author: string;
  credits: string;
  size: string;
  version: string;
}

interface VerifiedEvent {
  type: "verified";
  icon: FunctionalComponent;
  eventColor: string;
  filename: string;
  author: string;
  duration: string;
  version: string;
}

interface DownloadedEvent {
  type: "downloaded";
  icon: FunctionalComponent;
  eventColor: string;
  filename: string;
  author: string;
  version: string;
}

type WebhookEventTemplate =
  | UploadedEvent
  | RedactedEvent
  | VerifiedEvent
  | DownloadedEvent;

interface WebhookEvent extends WebhookEventTemplate {
  id: number;
  timestamp: string;
}

const events = ref<WebhookEvent[]>([]);
let eventCounter = 0;
let interval: number | null = null;

const eventTemplates: WebhookEventTemplate[] = [
  {
    type: "uploaded",
    icon: Upload,
    eventColor:
      "bg-blue-500/20 text-blue-900 dark:text-blue-200 border-blue-500/30",
    filename: "Q4-Report.pdf",
    author: "john@nvisy.com",
    size: "2.4 MB",
  },
  {
    type: "redacted",
    icon: Shield,
    eventColor:
      "bg-green-500/20 text-green-900 dark:text-green-200 border-green-500/30",
    filename: "Contract-2024.docx",
    author: "sarah@nvisy.com",
    credits: "28",
    size: "3.1 MB",
    version: "v2.1.3",
  },
  {
    type: "verified",
    icon: CheckCircle,
    eventColor:
      "bg-green-500/20 text-green-900 dark:text-green-200 border-green-500/30",
    filename: "Invoice-Nov.pdf",
    author: "mike@nvisy.com",
    duration: "40s",
    version: "v2.1.3",
  },
  {
    type: "downloaded",
    icon: Download,
    eventColor:
      "bg-blue-500/20 text-blue-900 dark:text-blue-200 border-blue-500/30",
    filename: "Report-Final.pdf",
    author: "alice@nvisy.com",
    version: "v2.1.3",
  },
];

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
  const template = eventTemplates[eventCounter % eventTemplates.length];
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
  <div class="bg-white dark:bg-black rounded-lg p-6 h-[280px] relative">
    <div class="space-y-6 relative overflow-hidden h-full">
      <TransitionGroup name="webhook">
        <div v-for="(event, index) in events" :key="event.id" class="relative">
          <!-- Vertical line connector -->
          <div
            v-if="index < events.length - 1"
            class="absolute left-5 w-px bg-gray-300 dark:bg-neutral-700"
            style="top: 50px; bottom: -14px"
          />

          <!-- Top row: Icon, Badge, Date -->
          <div class="flex items-center gap-4 mb-4">
            <div
              class="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-900 flex items-center justify-center flex-shrink-0 z-10"
            >
              <component
                :is="event.icon"
                class="w-5 h-5 text-gray-600 dark:text-neutral-300"
              />
            </div>
            <Badge
              :class="event.eventColor"
              class="text-sm font-light px-3 py-1"
            >
              {{ event.type }}
            </Badge>
            <div
              class="flex items-center gap-1 ml-auto text-xs font-light text-gray-600 dark:text-neutral-400"
            >
              <Calendar class="w-3 h-3" />
              {{ event.timestamp }}
            </div>
          </div>

          <!-- Bottom section: Metadata -->
          <div class="ml-14 text-xs font-light text-gray-900 dark:text-white">
            <!-- uploaded -->
            <div
              v-if="event.type === 'uploaded'"
              class="flex items-center gap-1.5 flex-wrap"
            >
              <Badge
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
              >
                {{ event.filename }}
              </Badge>
              <span>by</span>
              <Badge
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
              >
                {{ event.author }}
              </Badge>
              <Badge
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
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
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
              >
                {{ event.filename }}
              </Badge>
              <Badge
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
              >
                {{ event.version }}
              </Badge>
              <span>by</span>
              <Badge
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
              >
                {{ event.author }}
              </Badge>
              <span>using</span>
              <Badge
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
              >
                {{ event.credits }} credits
              </Badge>
              <span>and</span>
              <Badge
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
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
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
              >
                {{ event.filename }}
              </Badge>
              <Badge
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
              >
                {{ event.version }}
              </Badge>
              <span>by</span>
              <Badge
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
              >
                {{ event.author }}
              </Badge>
              <span>in</span>
              <Badge
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
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
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
              >
                {{ event.filename }}
              </Badge>
              <Badge
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
              >
                {{ event.version }}
              </Badge>
              <span>by</span>
              <Badge
                class="text-xs font-light bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white border-gray-300 dark:border-neutral-700"
              >
                {{ event.author }}
              </Badge>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- Fade effect at the bottom -->
      <div
        class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none z-10"
      />
    </div>
  </div>
</template>

<style scoped>
.webhook-enter-active {
  transition: all 0.5s ease-out;
}

.webhook-leave-active {
  transition: all 0.3s ease-in;
}

.webhook-enter-from {
  opacity: 0;
  transform: translateY(-15px);
}

.webhook-leave-to {
  opacity: 0;
  transform: translateY(15px);
}

.webhook-move {
  transition: transform 0.5s ease;
}
</style>
