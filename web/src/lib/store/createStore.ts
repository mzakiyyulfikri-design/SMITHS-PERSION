"use client";

import { useSyncExternalStore } from "react";

type Listener = () => void;

export type Store<T> = {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: Listener) => () => void;
  useStore: <S = T>(selector?: (state: T) => S) => S;
};

const isBrowser = typeof window !== "undefined";

function readFromStorage<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeToStorage<T>(key: string, value: T) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function createStore<T>(key: string, initial: T): Store<T> {
  let state: T = readFromStorage<T>(key, initial);
  const listeners = new Set<Listener>();

  const get = () => state;
  const set = (next: T | ((prev: T) => T)) => {
    state =
      typeof next === "function"
        ? (next as (p: T) => T)(state)
        : next;
    writeToStorage(key, state);
    listeners.forEach((l) => l());
  };
  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  // Cross-tab sync
  if (isBrowser) {
    window.addEventListener("storage", (e) => {
      if (e.key === key && e.newValue) {
        try {
          state = JSON.parse(e.newValue);
          listeners.forEach((l) => l());
        } catch {
          /* ignore */
        }
      }
    });
  }

  function useStore<S = T>(selector?: (state: T) => S): S {
    return useSyncExternalStore(
      subscribe,
      () => (selector ? selector(state) : (state as unknown as S)),
      () =>
        selector
          ? selector(initial)
          : (initial as unknown as S)
    );
  }

  return { get, set, subscribe, useStore };
}

/** Reset all stores to initial (useful for dev). */
export function resetStoreKey(key: string) {
  if (!isBrowser) return;
  window.localStorage.removeItem(key);
}
