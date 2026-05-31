import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULTS, STORAGE_KEYS } from '../constants/config';

export async function loadSettings() {
  try {
    const keys = Object.values(STORAGE_KEYS);
    const pairs = await AsyncStorage.multiGet(keys);
    const settings = {};
    for (const [key, val] of pairs) {
      if (val !== null) settings[key] = val;
    }
    return settings;
  } catch {
    return {};
  }
}

export async function saveSetting(key, value) {
  try {
    if (value === null || value === undefined) {
      await AsyncStorage.removeItem(key);
    } else if (value === DEFAULTS[key]) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, String(value));
    }
  } catch {}
}

export async function saveAllSettings(settings) {
  try {
    const entries = Object.entries(settings)
      .filter(([_, v]) => v != null && String(v).length > 0)
      .map(([k, v]) => [k, String(v)]);
    const removes = Object.entries(settings)
      .filter(([_, v]) => v == null || String(v).length === 0)
      .map(([k]) => k);

    if (entries.length > 0) await AsyncStorage.multiSet(entries);
    if (removes.length > 0) await AsyncStorage.multiRemove(removes);
  } catch {}
}

export async function getVoiceToggle() {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_ENABLED);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export async function setVoiceToggle(enabled) {
  await saveSetting(STORAGE_KEYS.VOICE_ENABLED, String(enabled));
}
