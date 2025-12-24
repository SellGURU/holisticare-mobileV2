import axios from "axios";
import Auth from "./auth";
// import { useToast } from "@/hooks/use-toast";

// const { toast } = useToast();

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // console.log(error);
    // if (
    //   error.response?.status == 401 ) {
    //   localStorage.clear();
    //   // Avoid full reload on mobile WebView; navigate to auth route instead
    //   window.location.href = "/auth";
    // }
    if (error.response?.status == 401) {
      // Don't reload page for login endpoint - let the login page handle the error
      const requestUrl = error.config?.url || "";
      const isLoginEndpoint =
        requestUrl.includes("/auth/mobile_token") ||
        requestUrl.includes("/auth/mobile_register");

      if (!isLoginEndpoint) {
        // Save brand_info before clearing localStorage
        Auth.refreshToken()
          .then((res) => {
            localStorage.setItem("health_session", res.data.access_token);
            localStorage.setItem("token", res.data.access_token);
            localStorage.setItem("encoded_mi", res.data.encoded_mi);
            localStorage.setItem("refresh_token", res.data.refresh_token);
          })
          .catch((err) => {
            const brandInfo = localStorage.getItem("brand_info");
            const biometricEnabled = localStorage.getItem("biometric_enabled");
            localStorage.clear();
            // Restore brand_info if it existed
            if (brandInfo) {
              localStorage.setItem("brand_info", brandInfo);
            }
            if (biometricEnabled) {
              localStorage.setItem("biometric_enabled", biometricEnabled);
            }
            window.location.href = "/auth";
            // window.location.reload();
          });
      }
    }

    return Promise.reject(error);
  }
);
