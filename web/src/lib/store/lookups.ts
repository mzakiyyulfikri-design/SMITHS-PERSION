"use client";

import { menuStore, orStore, staffStore } from ".";

export function lookupStaff(id: string) {
  return staffStore.get().find((s) => s.id === id);
}
export function lookupRoom(id: string) {
  return orStore.get().find((r) => r.id === id);
}
export function lookupSurgery(id: string) {
  return menuStore.get().find((m) => m.id === id);
}
