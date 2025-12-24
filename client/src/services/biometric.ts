import {
  BiometricAuth,
  BiometryType,
} from "@aparajita/capacitor-biometric-auth";
import { Capacitor } from "@capacitor/core";

export const biometric = {
  async getBiometryType(): Promise<BiometryType | null> {
    if (Capacitor.getPlatform() === "web") return null;

    try {
      const result = await BiometricAuth.checkBiometry();

      if (result.isAvailable && result.biometryType) {
        return result.biometryType;
      }

      return null;
    } catch (err) {
      console.error("Biometric check failed", err);
      return null;
    }
  },

  async authenticate(): Promise<boolean> {
    if (Capacitor.getPlatform() === "web") return false;
    try {
      await BiometricAuth.authenticate({
        reason: "Authenticate to continue",
        iosFallbackTitle: "Use Passcode",
      });
      return true;
    } catch (error: any) {
      console.error("Biometric authentication failed:", error);
      return false;
    }
  },
};
