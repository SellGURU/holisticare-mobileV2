import { openExternalUrl } from "@/lib/open-external-url";
import { Capacitor } from "@capacitor/core";

export type SavePdfResult = "shared" | "downloaded" | "opened";

export function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim() || "HolisticPlanReport.pdf";
  return trimmed.replace(/[\\/:*?"<>|]/g, "_");
}

export function isAndroidWebBrowser(
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent,
) {
  return /Android/i.test(userAgent);
}

export function chooseWebPdfSaveMethod({
  canShareFiles,
  isAndroidWeb,
  hasPreviewWindow,
}: {
  canShareFiles: boolean;
  isAndroidWeb: boolean;
  hasPreviewWindow: boolean;
}): "share" | "preview" | "download" {
  if (canShareFiles) return "share";
  if (isAndroidWeb && hasPreviewWindow) return "preview";
  if (isAndroidWeb) return "preview";
  return "download";
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function downloadBlobInBrowser(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener";
  link.type = "application/pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

function openBlobInWindow(blob: Blob, target: Window | null) {
  const objectUrl = URL.createObjectURL(blob);
  if (target && !target.closed) {
    target.location.href = objectUrl;
  } else {
    const opened = window.open(objectUrl, "_blank", "noopener");
    if (!opened) {
      window.location.href = objectUrl;
    }
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

function canSharePdfFile(file: File) {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (typeof nav.share !== "function") return false;
  if (typeof nav.canShare !== "function") return true;
  try {
    return nav.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Android Chrome drops the user-gesture after `await fetch`, then ignores
 * `<a download>` on blob URLs. Open a tab during the click so we can still
 * show the PDF if share/download are blocked.
 */
export function reserveWebPdfWindow(): Window | null {
  if (Capacitor.isNativePlatform()) return null;
  if (typeof window === "undefined") return null;
  if (!isAndroidWebBrowser()) return null;
  try {
    return window.open("about:blank", "_blank");
  } catch {
    return null;
  }
}

async function sharePdfInBrowser(blob: Blob, fileName: string) {
  const file = new File([blob], fileName, {
    type: blob.type || "application/pdf",
  });
  if (!canSharePdfFile(file)) {
    throw new Error("Web share is not available");
  }
  await navigator.share({
    files: [file],
    title: "Holistic Plan Report",
    text: fileName,
  });
}

async function sharePdfOnNative(blob: Blob, fileName: string) {
  const [{ Directory, Filesystem }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  const base64 = await blobToBase64(blob);
  await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  });
  const { uri } = await Filesystem.getUri({
    path: fileName,
    directory: Directory.Cache,
  });
  await Share.share({
    title: "Holistic Plan Report",
    text: fileName,
    url: uri,
    files: [uri],
    dialogTitle: "Save report",
  });
}

async function savePdfInBrowser(
  blob: Blob,
  fileName: string,
  previewWindow?: Window | null,
): Promise<SavePdfResult> {
  const androidWeb = isAndroidWebBrowser();
  const file = new File([blob], fileName, {
    type: blob.type || "application/pdf",
  });
  const method = chooseWebPdfSaveMethod({
    canShareFiles: canSharePdfFile(file),
    isAndroidWeb: androidWeb,
    hasPreviewWindow: Boolean(previewWindow && !previewWindow.closed),
  });

  if (method === "share") {
    try {
      await sharePdfInBrowser(blob, fileName);
      previewWindow?.close();
      return "shared";
    } catch (error) {
      const message = String(
        error instanceof Error ? error.message : error ?? "",
      );
      if (/abort|cancel/i.test(message)) {
        previewWindow?.close();
        return "shared";
      }
    }
  }

  if (androidWeb) {
    openBlobInWindow(blob, previewWindow ?? null);
    return "opened";
  }

  downloadBlobInBrowser(blob, fileName);
  previewWindow?.close();
  return "downloaded";
}

/**
 * Web: trigger a normal browser download, or on Android Chrome share/open
 * the PDF (a[download] is ignored there after an async fetch).
 * Native WebView: write the PDF to cache and open the system share sheet.
 */
export async function savePdfBlob(
  blob: Blob,
  fileName: string,
  options?: { fallbackUrl?: string; previewWindow?: Window | null },
): Promise<SavePdfResult> {
  const safeName = sanitizeFileName(fileName);

  if (!Capacitor.isNativePlatform()) {
    try {
      return await savePdfInBrowser(blob, safeName, options?.previewWindow);
    } catch (error) {
      const fallbackUrl = options?.fallbackUrl?.trim();
      if (!fallbackUrl) {
        throw error;
      }
      options?.previewWindow?.close();
      await openExternalUrl(fallbackUrl);
      return "opened";
    }
  }

  try {
    await sharePdfOnNative(blob, safeName);
    return "shared";
  } catch (error) {
    const message = String(
      error instanceof Error ? error.message : error ?? "",
    );
    if (/cancel/i.test(message)) {
      return "shared";
    }
    const fallbackUrl = options?.fallbackUrl?.trim();
    if (!fallbackUrl) {
      throw error;
    }
    console.warn("Native PDF share failed; opening in system browser:", error);
    await openExternalUrl(fallbackUrl);
    return "opened";
  }
}
