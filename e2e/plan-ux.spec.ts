import { expect, test, type Page } from "@playwright/test";
import { installMobileApiMocks } from "./fixtures/mobile-api";

const YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

function isoDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
}

function weekdayLabel(offsetDays: number) {
  return new Date(isoDate(offsetDays) + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "short" }
  );
}

function buildTasks(checkedIds: Set<string>) {
  const status = (id: string) => checkedIds.has(id);
  return [
    {
      Category: "Activity",
      Description: "Pelvic floor practice",
      Instruction: "Do the contractions shown in the video",
      Task_Type: "Action",
      Times: ["Morning"],
      Title: "Kegel Routine",
      Frequency_Type: "Daily",
      Status: status("activity-1"),
      Updated_at: "2026-10-03T00:00:00Z",
      task_id: "activity-1",
      Sections: [
        {
          Sets: 3,
          Type: "strength",
          Section: "Main",
          Exercises: [
            {
              Title: "Pelvic Floor Contraction",
              Description: "Squeeze and hold",
              Instruction: "Hold for 5 seconds",
              Reps: "15",
              Rest: "30",
              Weight: "-",
              Status: status("exercise-1"),
              task_id: "exercise-1",
              Files: [
                {
                  Type: "link",
                  Title: "YouTube demo",
                  Content: { url: YOUTUBE_URL, file_id: "" },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      Category: "Diet",
      Instruction: "Hit your macro targets",
      Task_Type: "Action",
      Title: "High Protein Plate",
      Status: status("diet-1"),
      Updated_at: "2026-10-03T00:00:00Z",
      task_id: "diet-1",
      Total_macros: { Protein: 140, Carbs: 180, Fats: 55 },
    },
    {
      Category: "Supplement",
      Instruction: "Take with food",
      Task_Type: "Action",
      Title: "Vitamin D",
      Dose: "1000 mg",
      Status: status("supp-1"),
      Updated_at: "2026-10-03T00:00:00Z",
      task_id: "supp-1",
    },
    {
      Category: "Lifestyle",
      Instruction: "Wind down before bed",
      Task_Type: "Action",
      Title: "Sleep window",
      Value: 8,
      Unit: "hours",
      Temp_value: 0,
      Status: status("life-1"),
      Updated_at: "2026-10-03T00:00:00Z",
      task_id: "life-1",
    },
    {
      Category: "Medical Peptide Therapy",
      Instruction: "Inject as scheduled",
      Task_Type: "Action",
      Title: "Peptide protocol",
      Status: status("pep-1"),
      Updated_at: "2026-10-03T00:00:00Z",
      task_id: "pep-1",
      Dose_Schedules: [
        {
          Title: "Morning",
          Dose: "250 mcg",
          Frequency_Type: "Daily",
          Frequency_Days: ["Mon", "Wed", "Fri"],
        },
      ],
    },
    {
      Category: "Test",
      Task_Type: "Checkin",
      Title: "Daily check-in",
      Questions_Count: 6,
      Estimated_time: "3 min",
      Status: status("checkin-1"),
      Updated_at: "2026-10-03T00:00:00Z",
      task_id: "checkin-1",
    },
    {
      Category: "Diet",
      Instruction: "Already eaten",
      Task_Type: "Action",
      Title: "Completed breakfast",
      Status: true,
      Updated_at: "2026-10-03T00:00:00Z",
      task_id: "diet-done",
      Total_macros: { Protein: 30, Carbs: 40, Fats: 12 },
    },
  ];
}

async function installPlanUxMocks(page: Page) {
  const checkedIds = new Set<string>(["diet-done"]);
  await installMobileApiMocks(page);
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method().toUpperCase();
    let path = url;
    try {
      path = new URL(url).pathname;
    } catch {
      path = url;
    }

    const fulfill = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>exercise video</body></html>",
      });
    }

    if (path.includes("/mobile/check_task") && method === "POST") {
      const body = request.postDataJSON() as { task_id?: string };
      if (body.task_id) checkedIds.add(body.task_id);
      return fulfill({ ok: true });
    }
    if (path.includes("/mobile/uncheck_task") && method === "POST") {
      const body = request.postDataJSON() as { task_id?: string };
      if (body.task_id) checkedIds.delete(body.task_id);
      return fulfill({ ok: true });
    }
    if (path.includes("/mobile/update_value") && method === "POST") {
      return fulfill({ ok: true });
    }
    if (path.includes("/mobile/today_tasks")) {
      return fulfill(buildTasks(checkedIds));
    }
    if (path.includes("/mobile/weekly_tasks")) {
      return fulfill([
        {
          date: isoDate(0),
          day: weekdayLabel(0),
          progress: 0,
          tasks: buildTasks(checkedIds),
        },
        {
          date: isoDate(-1),
          day: weekdayLabel(-1),
          progress: 0,
          tasks: [
            {
              Category: "Activity",
              Instruction: "Yesterday only",
              Task_Type: "Action",
              Title: "Yesterday walk",
              Status: false,
              Updated_at: "2026-10-02T00:00:00Z",
              task_id: "yesterday-1",
            },
          ],
        },
      ]);
    }

    return route.fallback();
  });
}

async function login(page: Page) {
  await page.goto("/");
  const continueBtn = page.getByRole("button", { name: /^Continue$/i });
  await expect(continueBtn).toBeVisible({ timeout: 15_000 });
  await continueBtn.click();
  await expect(page.locator("#login-email")).toBeVisible({ timeout: 15_000 });
  const tokenRequest = page.waitForRequest(
    (req) => req.url().includes("/auth/mobile_token") && req.method() === "POST"
  );
  await page.locator("#login-email").fill("cleanup.client@example.com");
  await page.locator("#login-password").fill("CleanupPass123!");
  await page.getByTestId("button-login").click();
  await tokenRequest;
}

async function closeSheet(page: Page) {
  const dialog = page.getByRole("dialog");
  await page.mouse.click(24, 24);
  await expect(dialog).toHaveCount(0);
}

async function openPlan(page: Page) {
  await login(page);
  await expect(page.locator("[data-bottom-nav]")).toBeVisible({
    timeout: 20_000,
  });
  await page.locator('[data-bottom-nav] a[href="/plan"]').click();
  await expect(page).toHaveURL(/\/plan/);
  await expect(page.getByText("Your Plan")).toBeVisible();
}

test.describe("Plan tasks UX", () => {
  test.beforeEach(async ({ page }) => {
    await installPlanUxMocks(page);
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("Today: compact grouped list, filters, sheet media, complete/uncomplete", async ({
    page,
  }) => {
    await openPlan(page);

    await expect(page.getByRole("button", { name: "To do" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Done" })).toBeVisible();
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
    await expect(page.getByText(/1 Activity · 1 Diet · 1 Supplement/)).toBeVisible();
    await expect(page.getByText(/remaining/)).toBeVisible();

    await expect(page.getByText("Activity", { exact: true })).toBeVisible();
    await expect(page.getByText("Kegel Routine")).toBeVisible();
    await expect(page.getByText(/Daily · 15 reps/)).toBeVisible();
    await expect(page.getByText("Vitamin D")).toBeVisible();
    await expect(page.getByText("1000 mg").first()).toBeVisible();
    await expect(page.getByText("Daily check-in")).toBeVisible();

    await expect(page.getByText("Completed breakfast")).toHaveCount(0);
    await expect(page.getByText("Do the contractions shown in the video")).toHaveCount(0);
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Mark complete", exact: true })
    ).toHaveCount(0);

    await page.getByText("Kegel Routine").click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("How to do it")).toBeVisible();
    await expect(
      sheet.getByText("Do the contractions shown in the video")
    ).toBeVisible();
    await expect(sheet.getByText("Pelvic Floor Contraction")).toBeVisible();
    await expect(sheet.getByText(/Reps: 15/)).toBeVisible();
    await expect(sheet.locator("iframe")).toBeVisible();
    await sheet.getByRole("button", { name: "Mark complete" }).click();
    await closeSheet(page);
    await expect(page.getByText("Kegel Routine")).toHaveCount(0);

    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByText("Kegel Routine")).toBeVisible();
    await expect(page.getByText("Completed breakfast")).toBeVisible();

    await page.getByText("Kegel Routine").click();
    await expect(page.getByRole("dialog").getByRole("button", { name: "Completed" })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Completed" }).click();
    await closeSheet(page);

    await page.getByRole("button", { name: "To do" }).click();
    await expect(page.getByText("Kegel Routine")).toBeVisible();

    await page.getByText("High Protein Plate").click();
    await expect(page.getByRole("dialog").getByText("Protein", { exact: true })).toBeVisible();
    await expect(page.getByRole("dialog").getByText("140g")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Mark complete" }).click();
    await closeSheet(page);

    await page.getByText("Vitamin D").click();
    await expect(page.getByRole("dialog").getByText("1000 mg")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Mark complete" }).click();
    await closeSheet(page);

    await page.getByText("Peptide protocol").click();
    await expect(page.getByRole("dialog").getByText("250 mcg")).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Mark complete" }).click();
    await closeSheet(page);

    await page.getByText("Sleep window").click();
    const lifestyleSheet = page.getByRole("dialog");
    await lifestyleSheet.getByPlaceholder("Enter hours").fill("8");
    await lifestyleSheet.getByRole("button", { name: "Mark complete" }).click();
    await closeSheet(page);

    await page.getByText("Daily check-in").click();
    await expect(page.getByRole("dialog").getByText("Start Check-in")).toBeVisible();
    await closeSheet(page);
  });

  test("Calendar: other days stay view only", async ({ page }) => {
    await openPlan(page);
    await page.getByRole("tab", { name: /Calendar/i }).click();
    const yesterdayDay = isoDate(-1).split("-")[2];
    await page
      .locator("button")
      .filter({ hasText: weekdayLabel(-1) })
      .filter({ hasText: yesterdayDay })
      .click();
    await expect(page.getByText("View only")).toBeVisible();
    await expect(page.getByText("Yesterday walk")).toBeVisible();

    await page.getByText("Yesterday walk").click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("button", { name: "View only" })).toBeDisabled();
  });

  test.describe("desktop", () => {
    test.use({
      viewport: { width: 1280, height: 800 },
      isMobile: false,
      hasTouch: false,
    });

    test("sheet stays compact on wide screens", async ({ page }) => {
      await openPlan(page);
      await page.getByText("High Protein Plate").click();
      const box = await page.getByRole("dialog").boundingBox();
      expect(box?.width ?? 0).toBeLessThanOrEqual(448);
      expect(box?.width ?? 0).toBeGreaterThan(300);
    });
  });
});
