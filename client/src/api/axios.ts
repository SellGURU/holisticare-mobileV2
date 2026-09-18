import axios from "axios";
import Auth from "./auth";

// Guard so multiple simultaneous 401s only trigger one refresh/redirect.
let isHandlingAuthError = false;

const REFRESH_TIMEOUT_MS = 10000;
const MOBILE_REFRESH_ATTEMPTED_KEY = "hc_mobile_refresh_attempted";

function clearSessionKeepPrefs() {
  const brandInfo = localStorage.getItem("brand_info");
  const clinicSlug = localStorage.getItem("clinic_slug");
  const biometricEnabled = localStorage.getItem("biometric_enabled");
  localStorage.clear();
  if (brandInfo) {
    localStorage.setItem("brand_info", brandInfo);
  }
  if (clinicSlug) {
    localStorage.setItem("clinic_slug", clinicSlug);
  }
  if (biometricEnabled) {
    localStorage.setItem("biometric_enabled", biometricEnabled);
  }
}

function redirectToLogin() {
  try {
    sessionStorage.removeItem(MOBILE_REFRESH_ATTEMPTED_KEY);
  } catch {
    // Ignore quota / private-mode failures.
  }
  clearSessionKeepPrefs();
  window.location.href = "/auth";
}

function refreshWithTimeout() {
  return Promise.race([
    Auth.refreshToken(),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error("Session refresh timed out"));
      }, REFRESH_TIMEOUT_MS);
    }),
  ]);
}

axios.interceptors.response.use(
  (response) => {
    try {
      sessionStorage.removeItem(MOBILE_REFRESH_ATTEMPTED_KEY);
    } catch {
      // Ignore quota / private-mode failures.
    }
    return response;
  },
  (error) => {
    if (error.response?.status == 401) {
      const requestUrl = error.config?.url || "";
      // Let the auth endpoints reject normally so their own pages can show a
      // user-friendly message (e.g. "invalid credentials"). Also excludes the
      // refresh endpoint to avoid an infinite refresh loop.
      // FCM register can 401 for a clinic-guard mismatch; that must not
      // reload the logged-in shell.
      const isAuthEndpoint =
        requestUrl.includes("/auth/mobile_token") ||
        requestUrl.includes("/auth/mobile_register") ||
        requestUrl.includes("/auth/mobile_refresh") ||
        requestUrl.includes("/mobile/public_brand_info") ||
        requestUrl.includes("/notif/");

      if (!isAuthEndpoint) {
        if (!isHandlingAuthError) {
          isHandlingAuthError = true;
          let alreadyTriedRefresh = false;
          try {
            alreadyTriedRefresh = Boolean(
              sessionStorage.getItem(MOBILE_REFRESH_ATTEMPTED_KEY),
            );
          } catch {
            alreadyTriedRefresh = false;
          }
          if (alreadyTriedRefresh) {
            redirectToLogin();
            return Promise.reject(error);
          }
          try {
            sessionStorage.setItem(MOBILE_REFRESH_ATTEMPTED_KEY, "1");
          } catch {
            // Ignore quota / private-mode failures.
          }
          refreshWithTimeout()
            .then((res) => {
              localStorage.setItem("health_session", res.data.access_token);
              localStorage.setItem("token", res.data.access_token);
              localStorage.setItem("encoded_mi", res.data.encoded_mi);
              localStorage.setItem("refresh_token", res.data.refresh_token);
              window.location.reload();
            })
            .catch(() => {
              redirectToLogin();
            })
            .finally(() => {
              isHandlingAuthError = false;
            });
        }

        // Reject so callers can clear loaders. Refresh/redirect still runs above.
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
