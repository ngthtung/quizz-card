import { useSyncExternalStore } from 'react';

type Settings = {
  kanjiAudioEnabled: boolean;
};

const STORAGE_KEY = 'quizz-card.settings.v1';

const defaults: Settings = {
  kanjiAudioEnabled: true,
};

function load(): Settings {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

let current: Settings = load();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSettings(): Settings {
  return current;
}

export function setKanjiAudioEnabled(value: boolean) {
  if (current.kanjiAudioEnabled === value) return;
  current = { ...current, kanjiAudioEnabled: value };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore quota / unavailable storage
  }
  emit();
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings);
}
