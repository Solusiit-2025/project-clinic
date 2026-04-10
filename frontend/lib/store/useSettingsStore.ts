import { create } from 'zustand';
import api from '@/lib/api';
import { siteConfig } from '../siteConfig';

interface SettingsState {
  settings: any;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: any) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: siteConfig, // Default from siteConfig
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('settings');
      const dbSettings = response.data;
      
      // Merge dbSettings into siteConfig
      const mergedSettings = { ...siteConfig };
      dbSettings.forEach((s: any) => {
        if (s.key in mergedSettings) {
          (mergedSettings as any)[s.key] = s.value;
        }
      });

      set({ settings: mergedSettings, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateSetting: async (key: string, value: any) => {
    try {
      await api.post('settings', { key, value });
      // Update local state after success
      const currentSettings = get().settings;
      set({
        settings: { ...currentSettings, [key]: value }
      });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },
}));
