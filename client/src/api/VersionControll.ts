import axios from "axios";
import { resolveBaseEndPoint } from "@/api/base";

class VersionControll {
  protected static get(url: string, config?: any) {
    const response = axios.get(`${resolveBaseEndPoint()}${url}`, {
      headers: {
        "Content-Type": config?.headers?.["Content-Type"] || "application/json",
      },
    });
    return response;
  }

  public static getConfig = () => {
    return this.get("/dashboard/config");
  };
}

export default VersionControll;
