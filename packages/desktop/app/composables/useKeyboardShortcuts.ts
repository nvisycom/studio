import { useActiveTab } from "~/composables/useActiveTab";

// Track the previous tab before going to settings
const previousTab = ref<string>("files");

export function useKeyboardShortcuts() {
  const activeTab = useActiveTab();

  const handleKeyDown = (e: KeyboardEvent) => {
    const isMeta = e.metaKey || e.ctrlKey;

    // Don't intercept shortcuts when typing in input fields
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      // Allow Escape to work even in inputs
      if (e.key !== "Escape") {
        return;
      }
    }

    // Cmd+1: Files tab
    if (isMeta && e.key === "1") {
      e.preventDefault();
      activeTab.value = "files";
    }

    // Cmd+2: Integrations tab
    if (isMeta && e.key === "2") {
      e.preventDefault();
      activeTab.value = "integrations";
    }

    // Cmd+3: Services tab
    if (isMeta && e.key === "3") {
      e.preventDefault();
      activeTab.value = "services";
    }

    // Cmd+,: Open settings
    if (isMeta && e.key === ",") {
      e.preventDefault();
      // Remember current tab before switching to settings
      if (activeTab.value !== "settings") {
        previousTab.value = activeTab.value;
      }
      activeTab.value = "settings";
    }

    // Escape: Close settings/about and go back to previous tab
    if (e.key === "Escape") {
      if (activeTab.value === "settings" || activeTab.value === "about") {
        e.preventDefault();
        activeTab.value = previousTab.value || "files";
      }
    }
  };

  const registerShortcuts = () => {
    window.addEventListener("keydown", handleKeyDown);
  };

  const unregisterShortcuts = () => {
    window.removeEventListener("keydown", handleKeyDown);
  };

  return {
    registerShortcuts,
    unregisterShortcuts,
  };
}
