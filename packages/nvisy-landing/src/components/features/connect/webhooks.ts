import type { FunctionalComponent } from "vue";
import { CheckCircle, Download, FileSearch, Upload } from "lucide-vue-next";

export interface UploadedEvent {
  type: "uploaded";
  icon: FunctionalComponent;
  eventColor: string;
  filename: string;
  author: string;
  size: string;
}

export interface ExtractedEvent {
  type: "extracted";
  icon: FunctionalComponent;
  eventColor: string;
  filename: string;
  author: string;
  fields: string;
  size: string;
  version: string;
}

export interface VerifiedEvent {
  type: "verified";
  icon: FunctionalComponent;
  eventColor: string;
  filename: string;
  author: string;
  duration: string;
  version: string;
}

export interface DownloadedEvent {
  type: "downloaded";
  icon: FunctionalComponent;
  eventColor: string;
  filename: string;
  author: string;
  version: string;
}

export type WebhookEventTemplate =
  | UploadedEvent
  | ExtractedEvent
  | VerifiedEvent
  | DownloadedEvent;

export type WebhookEvent = WebhookEventTemplate & {
  id: number;
  timestamp: string;
};

export const webhookEvents: WebhookEventTemplate[] = [
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
    type: "extracted",
    icon: FileSearch,
    eventColor:
      "bg-green-500/20 text-green-900 dark:text-green-200 border-green-500/30",
    filename: "Contract-2024.docx",
    author: "sarah@nvisy.com",
    fields: "28",
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
