import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import { Capacitor } from "@capacitor/core";

const STORAGE_KEY = "health_credentials";

export type StoredCredentials = {
  email: string;
  password: string;
};

export const secureStorage = {
  async save(email: string, password: string): Promise<void> {
    if (Capacitor.getPlatform() === "web") return;

    const data = {
      email,
      password,
    };
    const dataString = JSON.stringify(data);
    await SecureStorage.set(STORAGE_KEY, dataString);
  },

  async get(): Promise<StoredCredentials | null> {
    if (Capacitor.getPlatform() === "web") return null;

    try {
      const value = await SecureStorage.get(STORAGE_KEY);

      if (!value) return null;

      if (typeof value !== "string") {
        return null;
      }

      return JSON.parse(value) as StoredCredentials;
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    if (Capacitor.getPlatform() === "web") return;
    try {
      await SecureStorage.remove(STORAGE_KEY);
    } catch (ignore) {}
  },
};
