const baseProductEndPoint = "https://vercel-backend-one-roan.vercel.app/holisticare";
const baseTestEndPoint = "https://vercel-backend-one-roan.vercel.app/holisticare_test";
const baseProductUrl = 'https://holisticare.vercel.app'
const baseTestUrl = 'https://holisticare-develop.vercel.app'
const localurl= 'http://127.0.0.1:3800'

function resolveEnv(): 'test' | 'production' | 'local' {
  const fromVite = (import.meta as any).env?.VITE_API_ENV as string | undefined;
  if (fromVite === "local" || fromVite === "test" || fromVite === "production") {
    return fromVite;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "local";
    }
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

export { resolveBaseEndPoint, resolveBaseUrl, env, getRookProxyBase, getRookCredentials };
