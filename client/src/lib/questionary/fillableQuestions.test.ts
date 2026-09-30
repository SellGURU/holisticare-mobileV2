import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fillableQuestions, isScoringSentinel } from "./fillableQuestions.ts";
import ResolveConditions from "./resolveConditions.ts";

describe("fillableQuestions", () => {
  it("drops scoring sentinels and keeps real questions", () => {
    const questions = [
      { id: "q1", question: "How are you?" },
      { __scoring__: { formula: "sum(q1)" } },
    ];
    assert.equal(isScoringSentinel(questions[1]), true);
    assert.deepEqual(fillableQuestions(questions), [questions[0]]);
  });
});

describe("ResolveConditions", () => {
  it("hides follow-up questions until the rule matches", () => {
    const questions = [
      { order: 1, question: "Smoke?", type: "yes/no", response: "No" },
      {
        order: 2,
        question: "How many?",
        type: "number",
        response: "",
        conditions: [
          {
            priority: 1,
            logic: "AND",
            rules: [{ question_order: 1, operator: "equals", value: "Yes" }],
            actions: [{ type: "show" }],
          },
        ],
      },
    ];
    const hidden = ResolveConditions(questions);
    assert.equal(hidden[1].skip_validation, true);

    const shown = ResolveConditions([
      { ...questions[0], response: "Yes" },
      questions[1],
    ]);
    assert.equal(shown[1].skip_validation, false);
  });
});
