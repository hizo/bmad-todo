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

    await expect(page.getByText(/No todos yet/)).toBeVisible();
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
