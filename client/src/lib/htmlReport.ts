import { Capacitor } from "@capacitor/core";
import { resolveMobileReportUrl } from "@/api/base";

export type HtmlReportState = {
  hasHtmlReport: boolean;
  urls: { html: string; pdf: string } | null;
  detail: string;
};

export function isValidReportUrl(url: unknown): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

export function isApiProxyReportUrl(url: string) {
  return url.includes("/mobile/html_report/");
}

export function isAzureBlobUrl(url: string) {
  return url.includes("blob.core.windows.net");
}

export function firstReportUrl(...candidates: unknown[]) {
  const resolved = candidates
    .filter(isValidReportUrl)
    .map((candidate) => resolveMobileReportUrl(candidate.trim()));
  if (resolved.length === 0) return "";
  if (!Capacitor.isNativePlatform()) return resolved[0];
  return (
    resolved.find(isApiProxyReportUrl) ||
    resolved.find((url) => !isAzureBlobUrl(url)) ||
    resolved[0]
  );
}

export function resolveHtmlReportState(data: unknown): HtmlReportState {
  const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const html = firstReportUrl(payload.html, payload.html_proxy, payload.html_sas);
  const pdf = firstReportUrl(payload.pdf, payload.pdf_proxy, payload.pdf_sas);
  const detail = typeof payload.detail === "string" ? payload.detail.trim() : "";
  if (html && pdf) {
    return { hasHtmlReport: true, urls: { html, pdf }, detail: "" };
  }
  return { hasHtmlReport: false, urls: null, detail };
}
