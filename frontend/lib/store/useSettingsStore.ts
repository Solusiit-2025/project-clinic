import { create } from 'zustand';
import axios from 'axios';
import { siteConfig } from '../siteConfig';

interface SettingsState {
  settings: any;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: any) => Promise<void>;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: siteConfig, // Default from siteConfig
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/settings`);
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
      await axios.post(`${API_URL}/settings`, { key, value });
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
