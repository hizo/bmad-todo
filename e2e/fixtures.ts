import { test as base, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BACKEND_URL = "http://localhost:3000";

type A11yFixtures = {
  makeAxeBuilder: () => AxeBuilder;
  resetDb: () => Promise<void>;
};

export const test = base.extend<A11yFixtures>({
  makeAxeBuilder: async ({ page }, use) => {
    await use(() => new AxeBuilder({ page }));
  },
  resetDb: async ({ request }, use) => {
    await use(async () => {
      await request.delete(`${BACKEND_URL}/test/reset`);
    });
  },
});

export { expect };

/**
 * Run an axe accessibility scan and assert zero violations.
 * Call after the page is in a stable, interactive state.
 */
export async function expectNoA11yViolations(makeAxeBuilder: () => AxeBuilder) {
  const results = await makeAxeBuilder().withTags(["wcag2a", "wcag2aa"]).analyze();

  const violations = results.violations.map(
    (v) =>
      `[${v.impact}] ${v.id}: ${v.description}\n  ${v.nodes.map((n) => n.html).join("\n  ")}`,
  );

  expect(violations, `Accessibility violations found:\n${violations.join("\n\n")}`).toHaveLength(
    0,
  );
}
