"use client";

import { useSyncExternalStore } from "react";

/**
 * "Your name" for votes and submissions. There is no auth by design (demo scope),
 * so the name lives in localStorage. Every access is guarded: storage can throw in
 * private mode or when disabled by policy, and the app must keep working.
 */

const STORAGE_KEY = "feature-intelligence:name";
const CHANGE_EVENT = "feature-intelligence:name-change";
export const MAX_NAME_LENGTH = 80;

function readName(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveName(name: string): void {
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  try {
    if (trimmed) {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage unavailable: the name simply is not remembered across visits.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Server snapshot is empty so hydration matches; the stored name appears right after. */
export function useStoredName(): string {
  return useSyncExternalStore(subscribe, readName, () => "");
}
