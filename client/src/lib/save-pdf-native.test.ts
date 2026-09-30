import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chooseWebPdfSaveMethod,
  isAndroidWebBrowser,
  sanitizeFileName,
} from "./save-pdf-native.ts";

describe("sanitizeFileName", () => {
  it("replaces illegal filename characters", () => {
    assert.equal(sanitizeFileName("Plan: Q1/2026?.pdf"), "Plan_ Q1_2026_.pdf");
  });
});

describe("isAndroidWebBrowser", () => {
  it("detects Android Chrome and not iOS or desktop", () => {
    assert.equal(
      isAndroidWebBrowser(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0.0.0 Mobile Safari/537.36",
      ),
      true,
    );
    assert.equal(
      isAndroidWebBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      ),
      false,
    );
    assert.equal(
      isAndroidWebBrowser(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36",
      ),
      false,
    );
  });
});

describe("chooseWebPdfSaveMethod", () => {
  it("prefers the share sheet when the browser can share files", () => {
    assert.equal(
      chooseWebPdfSaveMethod({
        canShareFiles: true,
        isAndroidWeb: true,
        hasPreviewWindow: true,
      }),
      "share",
    );
  });

  it("opens the PDF on Android web when share is unavailable", () => {
    assert.equal(
      chooseWebPdfSaveMethod({
        canShareFiles: false,
        isAndroidWeb: true,
        hasPreviewWindow: false,
      }),
      "preview",
    );
  });

  it("uses a download link on desktop web", () => {
    assert.equal(
      chooseWebPdfSaveMethod({
        canShareFiles: false,
        isAndroidWeb: false,
        hasPreviewWindow: false,
      }),
      "download",
    );
  });
});
