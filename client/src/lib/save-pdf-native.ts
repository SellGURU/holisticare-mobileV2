import { openExternalUrl } from "@/lib/open-external-url";
import { Capacitor } from "@capacitor/core";

export type SavePdfResult = "shared" | "downloaded" | "opened";

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim() || "HolisticPlanReport.pdf";
  return trimmed.replace(/[\\/:*?"<>|]/g, "_");
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
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
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

/**
 * Web: trigger a normal browser download.
 * Native WebView: write the PDF to cache and open the system share sheet
 * so the user can save it (a[download] is ignored on Capacitor).
 */
export async function savePdfBlob(
  blob: Blob,
  fileName: string,
  options?: { fallbackUrl?: string },
): Promise<SavePdfResult> {
  const safeName = sanitizeFileName(fileName);

  if (!Capacitor.isNativePlatform()) {
    downloadBlobInBrowser(blob, safeName);
    return "downloaded";
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
