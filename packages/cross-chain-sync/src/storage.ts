/**
 * State Storage Abstraction
 *
 * Provides a pluggable storage backend for cross-chain state.
 */

import type { StateStorage } from "./types.js";

/**
 * In-memory storage implementation (for testing and server-side use).
 */
export class InMemoryStorage implements StateStorage {
  private store: Map<string, string> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const raw = this.store.get(key);
    if (raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async getState(): Promise<any> {
    const raw = this.store.get("session-state");
    if (raw === undefined) return { accounts: [] };
    try {
      return JSON.parse(raw);
    } catch {
      return { accounts: [] };
    }
  }

  async setState(state: any): Promise<void> {
    this.store.set("session-state", JSON.stringify(state));
  }
}

/**
 * LocalStorage implementation (for browser use).
 */
export class LocalStorage implements StateStorage {
  async get<T>(key: string): Promise<T | null> {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }

  async getState(): Promise<any> {
    const raw = localStorage.getItem("session-state");
    if (raw === null) return { accounts: [] };
    try {
      return JSON.parse(raw);
    } catch {
      return { accounts: [] };
    }
  }

  async setState(state: any): Promise<void> {
    localStorage.setItem("session-state", JSON.stringify(state));
  }
}
