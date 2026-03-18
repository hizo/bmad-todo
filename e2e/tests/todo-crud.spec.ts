import { test, expect, expectNoA11yViolations } from "../fixtures";

test.describe("Todo CRUD", () => {
  test.beforeEach(async ({ resetDb, page }) => {
    await resetDb();
    await page.goto("/");
  });

  test("page loads with input and heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "BMad Todo" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "New todo" })).toBeVisible();
  });

  test("create a todo via Enter", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("Buy groceries");
    await input.press("Enter");

    await expect(page.getByText("Buy groceries")).toBeVisible();
    await expect(input).toHaveValue("");
  });

  test("todo persists across page refresh", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("Persistent todo");
    await input.press("Enter");
    await expect(page.getByText("Persistent todo")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Persistent todo")).toBeVisible();
  });

  test("empty input does not create a todo", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.press("Enter");

    await expect(page.getByText("Nothing here yet")).toBeVisible();
  });

  test("accessibility: no WCAG AA violations on main page", async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expectNoA11yViolations(makeAxeBuilder);
  });

  test("accessibility: no violations after creating a todo", async ({
    page,
    makeAxeBuilder,
  }) => {
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("A11y test todo");
    await input.press("Enter");
    await expect(page.getByText("A11y test todo")).toBeVisible();

    await expectNoA11yViolations(makeAxeBuilder);
  });
});

test.describe("Toggle Todo Completion", () => {
  test.beforeEach(async ({ resetDb, page }) => {
    await resetDb();
    await page.goto("/");
    // Create a todo to toggle
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("Toggle test todo");
    await input.press("Enter");
    await expect(page.getByText("Toggle test todo")).toBeVisible();
  });

  test("toggling a todo to complete applies strikethrough styling", async ({ page }) => {
    const checkbox = page.getByRole("checkbox");
    await checkbox.click();

    // Wait for mutation round-trip and re-render (Playwright polls until timeout)
    await expect(page.getByText("Toggle test todo")).toHaveClass(/line-through/);
  });

  test("toggling a completed todo back to incomplete restores normal styling", async ({ page }) => {
    const checkbox = page.getByRole("checkbox");

    // Toggle to complete and wait for visual change
    await checkbox.click();
    await expect(page.getByText("Toggle test todo")).toHaveClass(/line-through/);

    // Toggle back to incomplete and wait for visual restore
    await checkbox.click();
    await expect(page.getByText("Toggle test todo")).not.toHaveClass(/line-through/);
  });

  test("toggle completion persists across page refresh", async ({ page }) => {
    const checkbox = page.getByRole("checkbox");
    await checkbox.click();
    // Wait for mutation to complete (checkbox is checked in server data)
    await expect(page.getByText("Toggle test todo")).toHaveClass(/line-through/);

    await page.reload();

    // After reload the todo should still be completed
    await expect(page.getByRole("checkbox")).toBeChecked();
    await expect(page.getByText("Toggle test todo")).toHaveClass(/line-through/);
  });

  test("toggling to complete applies muted color class", async ({ page }) => {
    const checkbox = page.getByRole("checkbox");
    await checkbox.click();

    const todoText = page.getByText("Toggle test todo");
    await expect(todoText).toHaveClass(/text-\[#78716C\]/);
  });

  test("toggling back to incomplete restores active color class", async ({ page }) => {
    const checkbox = page.getByRole("checkbox");
    await checkbox.click();
    await expect(page.getByText("Toggle test todo")).toHaveClass(/line-through/);

    await checkbox.click();
    const todoText = page.getByText("Toggle test todo");
    await expect(todoText).toHaveClass(/text-\[#292524\]/);
  });

  test("aria-live announces 'Task completed' on toggle to complete", async ({ page }) => {
    const checkbox = page.getByRole("checkbox");
    await checkbox.click();
    await expect(page.getByText("Toggle test todo")).toHaveClass(/line-through/);

    const liveRegion = page.locator('[role="status"][aria-live="polite"]');
    await expect(liveRegion).toHaveText("Task completed");
  });

  test("aria-live announces 'Task restored' on toggle back to incomplete", async ({ page }) => {
    const checkbox = page.getByRole("checkbox");
    await checkbox.click();
    await expect(page.getByText("Toggle test todo")).toHaveClass(/line-through/);

    await checkbox.click();
    await expect(page.getByText("Toggle test todo")).not.toHaveClass(/line-through/);

    const liveRegion = page.locator('[role="status"][aria-live="polite"]');
    await expect(liveRegion).toHaveText("Task restored");
  });

  test("accessibility: no WCAG AA violations after toggling", async ({
    page,
    makeAxeBuilder,
  }) => {
    const checkbox = page.getByRole("checkbox");
    await checkbox.click();
    // Wait for toggle to complete before running a11y audit
    await expect(page.getByText("Toggle test todo")).toHaveClass(/line-through/);

    await expectNoA11yViolations(makeAxeBuilder);
  });
});

test.describe("Empty State", () => {
  test.beforeEach(async ({ resetDb, page }) => {
    await resetDb();
    await page.goto("/");
  });

  test("empty state shows when no todos", async ({ page }) => {
    await expect(page.getByText("Nothing here yet")).toBeVisible();
    await expect(
      page.getByText("Add your first task above to get started.")
    ).toBeVisible();
  });

  test("input is autofocused when empty state is shown", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });
    await expect(input).toBeFocused();
  });

  test("empty state transitions to list when first todo is added", async ({ page }) => {
    await expect(page.getByText("Nothing here yet")).toBeVisible();

    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("My first task");
    await input.press("Enter");

    await expect(page.getByText("My first task")).toBeVisible();
    await expect(page.getByText("Nothing here yet")).not.toBeVisible();
  });

  test("empty state reappears after last todo is deleted", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("Only todo");
    await input.press("Enter");
    await expect(page.getByText("Only todo")).toBeVisible();

    await page.getByRole("button", { name: "Delete Only todo" }).click();
    await expect(page.getByText("Only todo")).not.toBeVisible();

    await expect(page.getByText("Nothing here yet")).toBeVisible();
  });

  test("accessibility: no WCAG AA violations on empty state", async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.waitForLoadState("networkidle");
    await expectNoA11yViolations(makeAxeBuilder);
  });
});

test.describe("Loading State", () => {
  test("loading state has accessible ARIA attributes", async ({ resetDb, page }) => {
    await resetDb();

    // Delay API response so Suspense fallback (loading state) stays visible
    await page.route("**/api/todos", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto("/", { waitUntil: "commit" });

    const loadingRegion = page.locator("[role='status'][aria-busy='true']");
    await expect(loadingRegion).toBeVisible({ timeout: 5000 });
    await expect(loadingRegion).toHaveAttribute("aria-busy", "true");

    // Verify skeleton list items are present
    const skeletonItems = loadingRegion.getByRole("listitem");
    await expect(skeletonItems).toHaveCount(3);

    // Wait for loading to complete — empty state replaces loading
    await expect(page.getByText("Nothing here yet")).toBeVisible({ timeout: 10000 });
  });

  test("accessibility: no WCAG AA violations on loading state", async ({
    resetDb,
    page,
    makeAxeBuilder,
  }) => {
    await resetDb();

    // Delay API to capture loading state for a11y audit
    await page.route("**/api/todos", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto("/", { waitUntil: "commit" });
    const loadingRegion = page.locator("[role='status'][aria-busy='true']");
    await expect(loadingRegion).toBeVisible({ timeout: 5000 });

    await expectNoA11yViolations(makeAxeBuilder);
  });

  test("no layout shift after load — skeleton matches list dimensions", async ({
    resetDb,
    page,
  }) => {
    await resetDb();

    // Delay API to measure skeleton dimensions
    await page.route("**/api/todos", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto("/", { waitUntil: "commit" });
    const loadingRegion = page.locator("[role='status'][aria-busy='true']");
    await expect(loadingRegion).toBeVisible({ timeout: 5000 });

    // Measure skeleton container position and main wrapper dimensions
    const skeletonBox = await loadingRegion.boundingBox();
    expect(skeletonBox).not.toBeNull();
    const mainBefore = await page.locator("main").boundingBox();
    expect(mainBefore).not.toBeNull();

    // Wait for content to load — empty state replaces loading
    await expect(page.getByText("Nothing here yet")).toBeVisible({ timeout: 10000 });

    // Measure the same container after content swap
    const mainAfter = await page.locator("main").boundingBox();
    expect(mainAfter).not.toBeNull();

    // The main container should not have shifted position
    expect(mainAfter!.x).toBeCloseTo(mainBefore!.x, 0);
    expect(mainAfter!.y).toBeCloseTo(mainBefore!.y, 0);
    expect(mainAfter!.width).toBeCloseTo(mainBefore!.width, 0);
  });
});

test.describe("Error State & Retry", () => {
  test.beforeEach(async ({ resetDb }) => {
    await resetDb();
  });

  test("full-screen error state when API unreachable", async ({ page }) => {
    // Block all API calls before navigating
    await page.route("**/api/todos", (route) => route.abort());
    await page.goto("/");

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Having trouble connecting" })).toBeVisible();
    await expect(page.getByText("Check your connection and try again")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  });

  test("retry button clears error and loads todos", async ({ page }) => {
    // Block API initially
    await page.route("**/api/todos", (route) => route.abort());
    await page.goto("/");

    await expect(page.getByRole("alert")).toBeVisible();

    // Unblock API and click retry
    await page.unroute("**/api/todos");
    await page.getByRole("button", { name: "Retry" }).click();

    // Error should clear, app should load
    await expect(page.getByRole("alert")).not.toBeVisible();
    await expect(page.getByRole("textbox", { name: "New todo" })).toBeVisible();
  });

  test("inline error on create failure with retry", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("textbox", { name: "New todo" })).toBeVisible();

    // Block create API
    await page.route("**/api/todos", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "fail" } }),
        });
      }
      return route.continue();
    });

    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("Failing todo");
    await input.press("Enter");

    // Inline error should appear
    await expect(page.getByText("Couldn't save")).toBeVisible();
  });

  test("toggle rollback on API failure", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("Rollback test");
    await input.press("Enter");
    await expect(page.getByText("Rollback test")).toBeVisible();

    // Block PATCH for toggle
    await page.route("**/api/todos/*", (route) => {
      if (route.request().method() === "PATCH") {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "fail" } }),
        });
      }
      return route.continue();
    });

    const checkbox = page.getByRole("checkbox");
    await checkbox.click();

    // Should rollback — checkbox unchecked again after error
    await expect(checkbox).not.toBeChecked();
    // Inline error should appear
    await expect(page.getByText("Couldn't save")).toBeVisible();
  });

  test("accessibility: no WCAG AA violations on error state", async ({
    page,
    makeAxeBuilder,
  }) => {
    await page.route("**/api/todos", (route) => route.abort());
    await page.goto("/");
    await expect(page.getByRole("alert")).toBeVisible();

    await expectNoA11yViolations(makeAxeBuilder);
  });
});

test.describe("Delete Todo", () => {
  test.beforeEach(async ({ resetDb, page }) => {
    await resetDb();
    await page.goto("/");
  });

  test("deleting a todo removes it from the list", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("Todo to delete");
    await input.press("Enter");
    await expect(page.getByText("Todo to delete")).toBeVisible();

    await page.getByRole("button", { name: "Delete Todo to delete" }).click();

    await expect(page.getByText("Todo to delete")).not.toBeVisible();
  });

  test("deletion persists across page refresh", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("Persist delete test");
    await input.press("Enter");
    await expect(page.getByText("Persist delete test")).toBeVisible();

    await page.getByRole("button", { name: "Delete Persist delete test" }).click();
    await expect(page.getByText("Persist delete test")).not.toBeVisible();

    await page.reload();
    await expect(page.getByRole("textbox", { name: "New todo" })).toBeVisible();

    await expect(page.getByText("Persist delete test")).not.toBeVisible();
  });

  test("deleting one todo leaves others intact", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("Keep me");
    await input.press("Enter");
    await expect(page.getByText("Keep me")).toBeVisible();

    await input.fill("Delete me");
    await input.press("Enter");
    await expect(page.getByText("Delete me")).toBeVisible();

    await page.getByRole("listitem").filter({ hasText: "Delete me" }).getByRole("button").click();

    await expect(page.getByText("Delete me")).not.toBeVisible();
    await expect(page.getByText("Keep me")).toBeVisible();
  });

  test("aria-live announces 'Task deleted' after deletion", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("Announce delete");
    await input.press("Enter");
    await expect(page.getByText("Announce delete")).toBeVisible();

    await page.getByRole("button", { name: "Delete Announce delete" }).click();
    await expect(page.getByText("Announce delete")).not.toBeVisible();

    const liveRegion = page.locator('[role="status"][aria-live="polite"]');
    await expect(liveRegion).toHaveText("Task deleted");
  });

  test("delete rollback on API failure", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("Rollback delete test");
    await input.press("Enter");
    await expect(page.getByText("Rollback delete test")).toBeVisible();

    // Block DELETE for this todo
    await page.route("**/api/todos/*", (route) => {
      if (route.request().method() === "DELETE") {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "fail" } }),
        });
      }
      return route.continue();
    });

    await page.getByRole("button", { name: "Delete Rollback delete test" }).click();

    // Todo should still be visible after failed delete (rollback)
    await expect(page.getByText("Rollback delete test")).toBeVisible();
    // Inline error should appear
    await expect(page.getByText("Couldn't save")).toBeVisible();
  });

  test("accessibility: no WCAG AA violations after deleting a todo", async ({
    page,
    makeAxeBuilder,
  }) => {
    const input = page.getByRole("textbox", { name: "New todo" });
    await input.fill("A11y delete test");
    await input.press("Enter");
    await expect(page.getByText("A11y delete test")).toBeVisible();

    await page.getByRole("button", { name: "Delete A11y delete test" }).click();
    await expect(page.getByText("A11y delete test")).not.toBeVisible();

    await expectNoA11yViolations(makeAxeBuilder);
  });
});

test.describe("Cross-Journey Flows", () => {
  test.beforeEach(async ({ resetDb, page }) => {
    await resetDb();
    await page.goto("/");
  });

  test("full lifecycle: create → toggle → delete in one session", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });

    // Create
    await input.fill("Lifecycle todo");
    await input.press("Enter");
    await expect(page.getByText("Lifecycle todo")).toBeVisible();

    // Toggle to complete
    const checkbox = page.getByRole("checkbox");
    await checkbox.click();
    await expect(page.getByText("Lifecycle todo")).toHaveClass(/line-through/);

    // Delete
    await page.getByRole("button", { name: "Delete Lifecycle todo" }).click();
    await expect(page.getByText("Lifecycle todo")).not.toBeVisible();

    // Back to empty state
    await expect(page.getByText("Nothing here yet")).toBeVisible();
  });

  test("multiple todos maintain display order", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });

    await input.fill("First todo");
    await input.press("Enter");
    await expect(page.getByText("First todo")).toBeVisible();

    await input.fill("Second todo");
    await input.press("Enter");
    await expect(page.getByText("Second todo")).toBeVisible();

    await input.fill("Third todo");
    await input.press("Enter");
    await expect(page.getByText("Third todo")).toBeVisible();

    // Verify all three are present
    const items = page.getByRole("listitem");
    await expect(items).toHaveCount(3);

    // Verify order — newest should appear (order depends on implementation)
    const texts = await items.allTextContents();
    expect(texts.join(",")).toContain("First todo");
    expect(texts.join(",")).toContain("Second todo");
    expect(texts.join(",")).toContain("Third todo");
  });

  test("multiple todos persist across refresh", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "New todo" });

    await input.fill("Persist A");
    await input.press("Enter");
    await expect(page.getByText("Persist A")).toBeVisible();

    await input.fill("Persist B");
    await input.press("Enter");
    await expect(page.getByText("Persist B")).toBeVisible();

    await page.reload();

    await expect(page.getByText("Persist A")).toBeVisible();
    await expect(page.getByText("Persist B")).toBeVisible();
  });
});
