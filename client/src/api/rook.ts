/**
 * Rook Connect API: uses proxy when VITE_ROOK_PROXY_BASE is set (credentials on server),
 * otherwise uses VITE_ROOK_CLIENT_UUID + VITE_ROOK_PASSWORD (env only, no hardcoding).
 */
import { getRookProxyBase, getRookCredentials } from "./base";
import { getTokenFromLocalStorage } from "@/store/token";

const ROOK_API_URL = "https://api.rook-connect.com";

export async function fetchRookAuthorizers(userId: string): Promise<any> {
  const proxyBase = getRookProxyBase();
  if (proxyBase) {
    const token = getTokenFromLocalStorage();
    const res = await fetch(`${proxyBase.replace(/\/$/, "")}/api/rook/authorizers`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
    return res.json();
  }
  const creds = getRookCredentials();
  if (!creds) throw new Error("Rook credentials not configured (VITE_ROOK_CLIENT_UUID / VITE_ROOK_PASSWORD)");
  const auth = btoa(`${creds.clientUUID}:${creds.password}`);
  const res = await fetch(
    `${ROOK_API_URL}/api/v1/client_uuid/${creds.clientUUID}/user_id/${userId}/data_sources/authorizers`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function revokeRookDataSource(userId: string, dataSource: string): Promise<void> {
  const proxyBase = getRookProxyBase();
  if (proxyBase) {
    const token = getTokenFromLocalStorage();
    const res = await fetch(`${proxyBase.replace(/\/$/, "")}/api/rook/revoke`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data_source: dataSource }),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
    return;
  }
  const creds = getRookCredentials();
  if (!creds) throw new Error("Rook credentials not configured");
  const auth = btoa(`${creds.clientUUID}:${creds.password}`);
  const res = await fetch(
    `${ROOK_API_URL}/api/v1/user_id/${userId}/data_sources/revoke_auth`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data_source: dataSource }),
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export function getRookConfigForSdk(): { clientUUID: string; password: string } | null {
  return getRookCredentials() ?? null;
}
