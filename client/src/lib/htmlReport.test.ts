import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidReportUrl, resolveHtmlReportState } from "./htmlReport.ts";

describe("htmlReport", () => {
  it("accepts only non-empty string urls", () => {
    assert.equal(isValidReportUrl("https://example.com/report"), true);
    assert.equal(isValidReportUrl("  "), false);
    assert.equal(isValidReportUrl(null), false);
  });

  it("requires both html and pdf urls before marking a report ready", () => {
    const ready = resolveHtmlReportState({
      html: "https://example.com/report.html",
      pdf: "https://example.com/report.pdf",
    });
    assert.equal(ready.hasHtmlReport, true);
    assert.equal(ready.urls?.html, "https://example.com/report.html");
    assert.equal(ready.detail, "");

    const pending = resolveHtmlReportState({
      html: "",
      pdf: "https://example.com/report.pdf",
      detail: "Still generating",
    });
    assert.equal(pending.hasHtmlReport, false);
    assert.equal(pending.urls, null);
    assert.equal(pending.detail, "Still generating");
  });
});
