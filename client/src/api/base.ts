const baseProductEndPoint = "https://vercel-backend-one-roan.vercel.app/holisticare";
const baseTestEndPoint = "https://vercel-backend-one-roan.vercel.app/holisticare_test";
const baseProductUrl = 'https://holisticare.vercel.app'
const baseTestUrl = 'https://holisticare-develop.vercel.app'
const localurl= 'http://127.0.0.1:3800'

function isLocalDevHost(host: string) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

function resolveEnv(): 'test' | 'production' | 'local' {
  const fromVite = (import.meta as any).env?.VITE_API_ENV as string | undefined;
  if (fromVite === "local" || fromVite === "test" || fromVite === "production") {
    return fromVite;
  }
  if (typeof window !== "undefined" && isLocalDevHost(window.location.hostname)) {
    return "local";
  }
  if ((import.meta as any).env?.DEV) {
    return "local";
  }
  return "production";
}

let env: 'test' | 'production' | 'local' = resolveEnv();

const resolveBaseEndPoint = () => {
  env = resolveEnv();
  if (env == "local") {
    return localurl;
  }
  if (env == "test") {
    return baseTestEndPoint;
  }
  return baseProductEndPoint;
};

function isPrivateHttpUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return isLocalDevHost(host);
  } catch {
    return false;
  }
}

/** Point /mobile/html_report/* links at this app's API, never a LAN IP from the backend env. */
const resolveMobileReportUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const mobileIndex = parsed.pathname.indexOf("/mobile/html_report/");
    if (mobileIndex < 0) {
      return url;
    }
    const pageIsLocal =
      typeof window !== "undefined" && isLocalDevHost(window.location.hostname);
    if (pageIsLocal && isLocalDevHost(parsed.hostname)) {
      return url;
    }
    const apiBase = resolveBaseEndPoint().replace(/\/$/, "");
    const mobilePath = parsed.pathname.slice(mobileIndex);
    return `${apiBase}${mobilePath}${parsed.search}`;
  } catch {
    return url;
  }
};
const resolveBaseUrl = () => {
  if (env === "test") {
    return baseTestUrl;
  }
  return baseProductUrl;
};

// Rook: use proxy (no credentials on client) when set; otherwise use env credentials
const getRookProxyBase = (): string | undefined =>
  (import.meta as any).env?.VITE_ROOK_PROXY_BASE?.trim() || undefined;

const getRookCredentials = (): { clientUUID: string; password: string } | undefined => {
  const clientUUID = (import.meta as any).env?.VITE_ROOK_CLIENT_UUID?.trim();
  const password = (import.meta as any).env?.VITE_ROOK_PASSWORD?.trim();
  if (clientUUID && password) return { clientUUID, password };
  return undefined;
};

export { resolveBaseEndPoint, resolveBaseUrl, resolveMobileReportUrl, isPrivateHttpUrl, env, getRookProxyBase, getRookCredentials };
