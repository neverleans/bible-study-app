import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'biblia_user_id';
const DEFAULT_USER_ID = 'default-user';

function getInitialUserId(): string {
  if (browser) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    const generated = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'user-' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  }
  return DEFAULT_USER_ID;
}

export const currentUserId = writable<string>(getInitialUserId());

export function setUserId(newId: string): void {
  if (browser) {
    localStorage.setItem(STORAGE_KEY, newId);
  }
  currentUserId.set(newId);
}

export function getCurrentUserId(): string {
  if (browser) {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_USER_ID;
  }
  return DEFAULT_USER_ID;
}
