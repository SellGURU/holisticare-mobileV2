import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeContainerScrollTop } from "./scrollIntoMainContainer.ts";

describe("computeContainerScrollTop", () => {
  it("keeps the element at the start of the inner scroller with scroll-margin", () => {
    assert.equal(
      computeContainerScrollTop({
        containerScrollTop: 100,
        containerTop: 50,
        elementTop: 400,
        elementHeight: 80,
        containerHeight: 600,
        block: "start",
        extraOffset: 96,
      }),
      354,
    );
  });

  it("centers the element inside the inner scroller", () => {
    assert.equal(
      computeContainerScrollTop({
        containerScrollTop: 100,
        containerTop: 50,
        elementTop: 400,
        elementHeight: 80,
        containerHeight: 600,
        block: "center",
      }),
      190,
    );
  });

  it("does not scroll above the top of the container", () => {
    assert.equal(
      computeContainerScrollTop({
        containerScrollTop: 0,
        containerTop: 80,
        elementTop: 90,
        elementHeight: 40,
        containerHeight: 500,
        block: "start",
        extraOffset: 96,
      }),
      0,
    );
  });
});
