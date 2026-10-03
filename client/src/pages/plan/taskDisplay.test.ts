import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isTaskCompleted,
  mapTodayTaskStatus,
  mergePlanTasks,
  type Task,
} from "./taskDisplay.ts";

function activityTask(overrides: Partial<Task> = {}): Task {
  return {
    Title: "Walk",
    Task_Type: "Action",
    Category: "Activity",
    Status: false,
    Updated_at: "",
    task_id: "act-1",
    ...overrides,
  };
}

describe("isTaskCompleted", () => {
  it("treats an Activity as done when the parent Status is true", () => {
    assert.equal(
      isTaskCompleted(
        activityTask({
          Status: true,
          Sections: [
            {
              Sets: 1,
              Type: "Normalset",
              Section: "Main",
              Exercises: [
                {
                  Base_Score: 1,
                  Description: "",
                  Exercise_Filters: {
                    Type: [],
                    Level: [],
                    Terms: [],
                    Muscle: [],
                    Equipment: [],
                    Conditions: [],
                  },
                  Exercise_Location: [],
                  Files: [],
                  Instruction: "",
                  Reps: "",
                  Rest: "",
                  Status: false,
                  Title: "Walk",
                  Updated_at: "",
                  Weight: "",
                  task_id: "ex-1",
                },
              ],
            },
          ],
        }),
      ),
      true,
    );
  });

  it("uses exercise Status when the parent Activity is not marked done", () => {
    assert.equal(
      isTaskCompleted(
        activityTask({
          Status: false,
          Sections: [
            {
              Sets: 1,
              Type: "Normalset",
              Section: "Main",
              Exercises: [
                {
                  Base_Score: 1,
                  Description: "",
                  Exercise_Filters: {
                    Type: [],
                    Level: [],
                    Terms: [],
                    Muscle: [],
                    Equipment: [],
                    Conditions: [],
                  },
                  Exercise_Location: [],
                  Files: [],
                  Instruction: "",
                  Reps: "",
                  Rest: "",
                  Status: true,
                  Title: "Walk",
                  Updated_at: "",
                  Weight: "",
                  task_id: "ex-1",
                },
              ],
            },
          ],
        }),
      ),
      true,
    );
  });

  it("leaves an Activity incomplete when neither parent nor exercises are done", () => {
    assert.equal(isTaskCompleted(activityTask()), false);
  });
});

describe("plan task cache", () => {
  it("writes Activity completion onto the parent and exercises", () => {
    const updated = mapTodayTaskStatus(
      [
        activityTask({
          Sections: [
            {
              Sets: 1,
              Type: "Normalset",
              Section: "Main",
              Exercises: [
                {
                  Base_Score: 1,
                  Description: "",
                  Exercise_Filters: {
                    Type: [],
                    Level: [],
                    Terms: [],
                    Muscle: [],
                    Equipment: [],
                    Conditions: [],
                  },
                  Exercise_Location: [],
                  Files: [],
                  Instruction: "",
                  Reps: "",
                  Rest: "",
                  Status: false,
                  Title: "Walk",
                  Updated_at: "",
                  Weight: "",
                  task_id: "ex-1",
                },
              ],
            },
          ],
        }),
      ],
      "act-1",
      true,
    );
    assert.equal(updated?.[0].Status, true);
    assert.equal(updated?.[0].Sections?.[0].Exercises[0].Status, true);
    assert.equal(isTaskCompleted(updated![0]), true);
  });

  it("keeps a newer cached completion when the server snapshot is stale", () => {
    const local = activityTask({
      Status: true,
      Updated_at: "2026-10-03T12:00:00.000Z",
    });
    const server = activityTask({
      Status: false,
      Updated_at: "2026-10-03T11:00:00.000Z",
    });
    const merged = mergePlanTasks([server], [local]);
    assert.equal(merged[0].Status, true);
  });

  it("keeps a local Activity completion when refetch is newer but still incomplete", () => {
    const local = activityTask({
      Status: true,
      Updated_at: "2026-10-03T12:00:00.000Z",
    });
    const server = activityTask({
      Status: false,
      Updated_at: "2026-10-03T12:00:05.000Z",
    });
    const merged = mergePlanTasks([server], [local]);
    assert.equal(merged[0].Status, true);
  });
});
