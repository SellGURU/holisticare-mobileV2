import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampQuestionnaireStep,
  isQuestionVisible,
  resolveQuestionnaireState,
  sanitizeQuestionnaireRespond,
  visibleQuestionnaireQuestions,
} from "./conditionalQuestions.ts";
import ResolveConditions from "./resolveConditions.ts";

const followUp = {
  order: 2,
  question: "How many?",
  type: "number",
  response: "12",
  conditions: [
    {
      priority: 1,
      logic: "AND",
      rules: [{ question_order: 1, operator: "equals", value: "Yes" }],
      actions: [{ type: "show" }],
    },
  ],
};

describe("ResolveConditions", () => {
  it("shows a follow-up only when the AND rule matches", () => {
    const hidden = ResolveConditions([
      { order: 1, question: "Smoke?", type: "yes/no", response: "No" },
      followUp,
    ]);
    assert.equal(hidden[1].skip_validation, true);

    const shown = ResolveConditions([
      { order: 1, question: "Smoke?", type: "yes/no", response: "Yes" },
      followUp,
    ]);
    assert.equal(shown[1].skip_validation, false);
  });

  it("shows a question when any OR rule matches", () => {
    const questions = [
      { order: 1, question: "Mood?", type: "text", response: "tired" },
      {
        order: 2,
        question: "Need rest?",
        type: "yes/no",
        response: "",
        conditions: [
          {
            priority: 1,
            logic: "OR",
            rules: [
              { question_order: 1, operator: "equals", value: "tired" },
              { question_order: 1, operator: "equals", value: "sick" },
            ],
            actions: [{ type: "show" }],
          },
        ],
      },
    ];
    const shown = ResolveConditions(questions);
    assert.equal(shown[1].skip_validation, false);

    const hidden = ResolveConditions([
      { ...questions[0], response: "happy" },
      questions[1],
    ]);
    assert.equal(hidden[1].skip_validation, true);
  });

  it("keeps a hide-action question visible when the AND rule fails", () => {
    const questions = [
      { order: 1, question: "Pregnant?", type: "yes/no", response: "No" },
      {
        order: 2,
        question: "Continue",
        type: "text",
        response: "",
        conditions: [
          {
            priority: 1,
            logic: "AND",
            rules: [{ question_order: 1, operator: "equals", value: "Yes" }],
            actions: [{ type: "hide" }],
          },
        ],
      },
    ];
    const resolved = ResolveConditions(questions);
    assert.equal(resolved[1].skip_validation, false);
  });
});

describe("questionnaire visibility", () => {
  it("hides statically hidden questions even when conditions would show them", () => {
    const questions = [
      { order: 1, question: "Smoke?", type: "yes/no", response: "Yes" },
      {
        ...followUp,
        hide: true,
        skip_validation: false,
      },
    ];
    const resolved = resolveQuestionnaireState(questions, {});
    assert.equal(isQuestionVisible(resolved[1]), false);
    assert.equal(visibleQuestionnaireQuestions(resolved).length, 1);
  });

  it("does not show follow-up questions until the parent answer matches", () => {
    const questions = [
      { order: 1, question: "Smoke?", type: "yes/no" },
      followUp,
    ];
    const hidden = resolveQuestionnaireState(questions, { 0: "No", 1: "12" });
    assert.deepEqual(
      visibleQuestionnaireQuestions(hidden).map((question) => question.order),
      [1],
    );

    const shown = resolveQuestionnaireState(questions, { 0: "Yes", 1: "12" });
    assert.deepEqual(
      visibleQuestionnaireQuestions(shown).map((question) => question.order),
      [1, 2],
    );
  });
});

describe("sanitizeQuestionnaireRespond", () => {
  it("clears stale answers on hidden questions and keeps skip_validation", () => {
    const resolved = resolveQuestionnaireState(
      [
        { order: 1, question: "Smoke?", type: "yes/no" },
        { ...followUp, type: "checkbox" },
      ],
      { 0: "No", 1: ["a pack"] },
    );
    const payload = sanitizeQuestionnaireRespond(resolved, {
      0: "No",
      1: ["a pack"],
    });

    assert.equal(payload[0].response, "No");
    assert.equal(payload[0].skip_validation, false);
    assert.deepEqual(payload[1].response, []);
    assert.equal(payload[1].skip_validation, true);
  });

  it("clears file answers on statically hidden questions", () => {
    const payload = sanitizeQuestionnaireRespond(
      [
        {
          order: 1,
          type: "file uploader",
          hide: true,
          skip_validation: false,
          response: { frontal: "x.jpg" },
        },
      ],
      { 0: { frontal: "x.jpg" } },
    );
    assert.deepEqual(payload[0].response, {});
    assert.equal(payload[0].skip_validation, true);
  });
});

describe("clampQuestionnaireStep", () => {
  it("pulls the step back when fewer questions remain visible", () => {
    assert.equal(
      clampQuestionnaireStep({ step: 4, totalVisible: 2, showConsent: false }),
      1,
    );
    assert.equal(
      clampQuestionnaireStep({ step: 4, totalVisible: 2, showConsent: true }),
      2,
    );
    assert.equal(
      clampQuestionnaireStep({ step: 0, totalVisible: 3, showConsent: false }),
      0,
    );
  });
});
