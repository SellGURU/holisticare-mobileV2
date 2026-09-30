import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateCalendarAge,
  describeAgeComparison,
  formatMetricValue,
  friendlyAgeSeverity,
  friendlyScoreSeverity,
  hasValidScale,
  isPhenotypicAgeMetric,
  isFiniteNumber,
  resolveCalendarAge,
  scaleFillPercent,
  scoreToneFromSeverity,
} from "./intelligenceDisplay.ts";

describe("intelligenceDisplay", () => {
  it("does not treat missing values as zero", () => {
    assert.equal(formatMetricValue(null), "—");
    assert.equal(formatMetricValue(undefined), "—");
    assert.equal(isFiniteNumber(null), false);
    assert.equal(scaleFillPercent(null, 0, 100), null);
  });

  it("fills only when both scale bounds are proven", () => {
    assert.equal(hasValidScale(0, 100), true);
    assert.equal(hasValidScale(null, 100), false);
    assert.equal(hasValidScale(10, 10), false);
    assert.equal(scaleFillPercent(50, 0, 100), 50);
    assert.equal(scaleFillPercent(50, null, 100), null);
  });

  it("clamps visual fill without changing the raw value", () => {
    assert.equal(scaleFillPercent(150, 0, 100), 100);
    assert.equal(scaleFillPercent(-10, 0, 100), 0);
    assert.equal(formatMetricValue(72.5), "72.5");
    assert.equal(formatMetricValue(48), "48");
  });

  it("describes body age vs calendar age in plain language", () => {
    const younger = describeAgeComparison(26.4, 35);
    assert.equal(younger.tone, "younger");
    assert.match(younger.shortLabel, /younger/i);

    const aligned = describeAgeComparison(35, 35);
    assert.equal(aligned.tone, "aligned");

    assert.equal(friendlyAgeSeverity("Younger"), "On track");
  });

  it("maps clinic score labels without inventing a diagnosis", () => {
    assert.equal(scoreToneFromSeverity("Good"), "good");
    assert.equal(scoreToneFromSeverity("High"), "good");
    assert.equal(scoreToneFromSeverity("Poor"), "attention");
    assert.equal(scoreToneFromSeverity("Low"), "attention");
    assert.equal(scoreToneFromSeverity("Moderate"), "watch");
    assert.equal(scoreToneFromSeverity(""), "unknown");
    assert.equal(friendlyScoreSeverity("Good"), "On track");
    assert.equal(friendlyScoreSeverity("Poor"), "Talk with your clinic");
  });

  it("recognizes PhenoAge cards without hiding other age clocks", () => {
    assert.equal(
      isPhenotypicAgeMetric({
        key: "phenoage_e4d748",
        label: "Phenotypic Age",
      }),
      true,
    );
    assert.equal(
      isPhenotypicAgeMetric({
        key: "kidney_age",
        label: "Kidney Age",
      }),
      false,
    );
  });

  it("calculates calendar age from a YYYY-MM-DD birthday", () => {
    const now = new Date(2026, 8, 30);
    assert.equal(calculateCalendarAge("1996-09-30", now), 30);
    assert.equal(calculateCalendarAge("1996-10-01", now), 29);
    assert.equal(calculateCalendarAge("not-a-date", now), null);
    assert.equal(calculateCalendarAge("", now), null);
  });

  it("prefers a valid age and falls back to date of birth", () => {
    const now = new Date(2026, 8, 30);
    assert.equal(resolveCalendarAge(41, "1996-09-30", now), 41);
    assert.equal(resolveCalendarAge(0, "1996-09-30", now), 30);
    assert.equal(resolveCalendarAge(undefined, "1990-01-15", now), 36);
    assert.equal(resolveCalendarAge(undefined, undefined, now), null);
  });
});
