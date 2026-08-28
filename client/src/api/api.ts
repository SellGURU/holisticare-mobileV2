/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { getTokenFromLocalStorage } from "../store/token";
import { resolveBaseEndPoint} from "./base";
class Api {
  protected static get base_url(): string {
    return resolveBaseEndPoint();
  }
  protected static post(url: string, data?: any, config?: any) {
    if (!config?.noPending) {
    }
    const token = getTokenFromLocalStorage();
    const isLoginOrRegister =
      url.includes("/auth/mobile_token") ||
      url.includes("/auth/mobile_register");

    const headers: Record<string, string> = {
      "Content-Type": config?.headers?.["Content-Type"] || "application/json",
      ...(config?.headers || {}),
    };

    // Avoid sending stale "Bearer null"/old session tokens on login & register.
    if (token && !isLoginOrRegister) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      delete headers.Authorization;
    }

    const response = axios.post(this.base_url + url, data, {
      headers,
      onUploadProgress: (progressEvent: any) => {
        if (config?.onUploadProgress) {
          config.onUploadProgress(progressEvent);
        }
      },
      signal: config?.signal,
      timeout: config?.timeout ?? 15000,
    });
    return response;
  }
  protected static delete(url: string, config?: any) {
    const response = axios.delete(this.base_url + url, {
      headers: {
        Authorization: "Bearer " + getTokenFromLocalStorage(),
        "Content-Type": config?.headers?.["Content-Type"] || "application/json",
      },
      timeout: config?.timeout ?? 15000,
    });
    return response;
  }
  protected static get(url: string, config?: any) {
    const response = axios.get(this.base_url + url, {
      headers: {
        Authorization: "Bearer " + getTokenFromLocalStorage(),
        "Content-Type": config?.headers?.["Content-Type"] || "application/json",
      },
      timeout: config?.timeout ?? 15000,
    });
    return response;
  }

  protected static getPublic(url: string, config?: any) {
    const response = axios.get(this.base_url + url, {
      headers: {
        "Content-Type": config?.headers?.["Content-Type"] || "application/json",
      },
      timeout: config?.timeout ?? 15000,
    });
    return response;
  }

  protected static getCheck(value: string) {
    const response = axios.get(value, {
      method: "GET",
      headers: {
        Accept: "video/mp4;charset=UTF-8",
        responseType: "blob",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
      },
    });
    return response;
  }
}

export default Api;