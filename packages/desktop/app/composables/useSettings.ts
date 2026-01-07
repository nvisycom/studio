import { load, type Store } from '@tauri-apps/plugin-store';

export interface AppSettings {
  // Appearance
  useGradient: boolean;

  // Storage
  localFolders: string[];
  remoteFolder: string;

  // Sync
  autoSync: boolean;

  // Last state
  lastWorkspaceId: string;
}

const defaultSettings: AppSettings = {
  useGradient: true,
  localFolders: [],
  remoteFolder: '/Users/Documents/Nvisy',
  autoSync: false,
  lastWorkspaceId: 'workspace-1',
};

let store: Store | null = null;

const settings = ref<AppSettings>({ ...defaultSettings });
const isLoaded = ref(false);

async function initStore() {
  if (store) return store;

  try {
    store = await load('settings.json', { autoSave: true });
    return store;
  } catch (error) {
    console.error('Failed to load settings store:', error);
    return null;
  }
}

async function loadSettings() {
  const s = await initStore();
  if (!s) {
    isLoaded.value = true;
    return;
  }

  try {
    const keys = Object.keys(defaultSettings) as (keyof AppSettings)[];

    for (const key of keys) {
      const value = await s.get<AppSettings[typeof key]>(key);
      if (value !== null && value !== undefined) {
        (settings.value as Record<string, unknown>)[key] = value;
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  isLoaded.value = true;
}

async function saveSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  settings.value[key] = value;

  const s = await initStore();
  if (s) {
    try {
      await s.set(key, value);
    } catch (error) {
      console.error(`Failed to save setting ${key}:`, error);
    }
  }
}

async function saveAllSettings() {
  const s = await initStore();
  if (!s) return;

  try {
    const keys = Object.keys(settings.value) as (keyof AppSettings)[];
    for (const key of keys) {
      await s.set(key, settings.value[key]);
    }
  } catch (error) {
    console.error('Failed to save all settings:', error);
  }
}

export function useSettings() {
  // Load settings on first use
  if (!isLoaded.value) {
    loadSettings();
  }

  return {
    settings: readonly(settings),
    isLoaded: readonly(isLoaded),

    // Individual setters
    setUseGradient: (value: boolean) => saveSetting('useGradient', value),
    setLocalFolders: (value: string[]) => saveSetting('localFolders', value),
    setRemoteFolder: (value: string) => saveSetting('remoteFolder', value),
    setAutoSync: (value: boolean) => saveSetting('autoSync', value),
    setLastWorkspaceId: (value: string) => saveSetting('lastWorkspaceId', value),

    // Utility
    saveAllSettings,
    loadSettings,
  };
}
