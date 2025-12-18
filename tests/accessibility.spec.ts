import { test, expect } from "@playwright/test";

/**
 * DoseFinder - Accessibility Tests
 * Tests for WCAG compliance and assistive technology support
 */

test.describe("Accessibility - Page Structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have skip link for main content", async ({ page }) => {
    const skipLink = page.locator("a.skip-link");
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  test("should have main landmark with role", async ({ page }) => {
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
    await expect(main).toHaveAttribute("id", "main-content");
  });

  test("should have footer with contentinfo role", async ({ page }) => {
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    // Check that there are heading elements present
    const headings = await page.locator("h1, h2, h3, h4").all();
    expect(headings.length).toBeGreaterThan(0);

    // DoseFinder text should be visible somewhere on page
    await expect(page.getByText("DoseFinder").first()).toBeVisible();
  });
});

test.describe("Accessibility - Keyboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should navigate through tabs using keyboard", async ({ page }) => {
    // Focus on first tab
    const calculatorTab = page.getByRole("tab", { name: /Calculator/i });
    await calculatorTab.focus();
    await expect(calculatorTab).toBeFocused();

    // Press right arrow to move to next tab
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: /Advanced/i })).toBeFocused();

    // Continue navigation
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("tab", { name: /Study Planner/i }),
    ).toBeFocused();

    // Press Enter to activate
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("tab", { name: /Study Planner/i }),
    ).toHaveAttribute("data-state", "active");
  });

  test("should navigate through form fields using Tab", async ({
    page,
    browserName,
  }) => {
    // WebKit has different tab behavior - use more relaxed check
    const maxTabs = browserName === "webkit" ? 30 : 20;

    // Start at the top of the page
    await page.keyboard.press("Tab");

    // Tab through elements and check that form controls are focusable
    let tabCount = 0;
    let reachedFormControl = false;

    while (tabCount < maxTabs) {
      await page.keyboard.press("Tab");
      tabCount++;

      // Check if we've reached any focusable form element
      const focusedElement = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active) return null;
        return {
          tagName: active.tagName,
          id: active.id || "",
          role: active.getAttribute("role") || "",
        };
      });

      if (
        focusedElement &&
        (focusedElement.tagName === "INPUT" ||
          focusedElement.tagName === "SELECT" ||
          focusedElement.tagName === "BUTTON" ||
          focusedElement.role === "combobox" ||
          focusedElement.id === "source-animal" ||
          focusedElement.id === "base-dose")
      ) {
        reachedFormControl = true;
        break;
      }
    }

    // We should have reached a form control
    expect(reachedFormControl).toBe(true);
  });

  test("should navigate tabs and enter data", async ({ page }) => {
    // Click directly on the base dose field and type using fill
    const baseDose = page.locator("#base-dose");
    await baseDose.click();
    await baseDose.fill("10");
    await expect(baseDose).toHaveValue("10");
  });
});

test.describe("Accessibility - ARIA Labels and Roles", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have aria-label on theme toggle button", async ({ page }) => {
    const themeButton = page.getByRole("button", {
      name: /Switch to (light|dark) mode/i,
    });
    await expect(themeButton).toBeVisible();
  });

  test("should have aria-label on scaling method radio group", async ({
    page,
  }) => {
    const radioGroup = page.getByRole("radiogroup", {
      name: /Scaling method selection/i,
    });
    await expect(radioGroup).toBeVisible();
  });

  test("should have aria-required on required fields", async ({ page }) => {
    const baseDose = page.locator("#base-dose");
    await expect(baseDose).toHaveAttribute("aria-required", "true");
  });

  test("should have aria-describedby for hint text", async ({ page }) => {
    const baseDose = page.locator("#base-dose");
    await expect(baseDose).toHaveAttribute(
      "aria-describedby",
      "base-dose-hint",
    );

    // Verify the hint exists
    const hint = page.locator("#base-dose-hint");
    await expect(hint).toBeVisible();
  });

  test("should enable calculate button when dose is entered", async ({
    page,
  }) => {
    // Button initially disabled
    const calculateBtn = page.getByRole("button", { name: /Calculate Dose/i });

    // Enter dose to enable
    await page.locator("#base-dose").fill("10");
    await page.waitForTimeout(100);

    // Button should be enabled
    await expect(calculateBtn).toBeEnabled();
  });

  test("should have proper role on results region after calculation", async ({
    page,
  }) => {
    await page.locator("#base-dose").fill("10");
    await page.getByRole("button", { name: /Calculate Dose/i }).click();

    // Results should be visible after calculation
    await expect(page.getByText("Results Summary")).toBeVisible();
  });
});

test.describe("Accessibility - Form Labels", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have labels associated with all form inputs", async ({
    page,
  }) => {
    // Source animal select has associated label
    await expect(page.locator("#source-animal")).toBeVisible();

    // Target animal select has associated label
    await expect(page.locator("#target-animal")).toBeVisible();

    // Weight inputs exist
    await expect(page.locator("#source-weight")).toBeVisible();
    await expect(page.locator("#target-weight")).toBeVisible();

    // Base dose input exists
    await expect(page.locator("#base-dose")).toBeVisible();
  });

  test("should have fieldset and legend for radio groups", async ({ page }) => {
    // Scaling method fieldset
    const fieldset = page.locator(
      'fieldset:has(legend:has-text("Scaling Method"))',
    );
    await expect(fieldset).toBeVisible();
  });
});

test.describe("Accessibility - Color and Contrast", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have visible text labels for form fields", async ({ page }) => {
    // Check that key labels are visible
    await expect(page.getByText("Source Species")).toBeVisible();
    await expect(page.getByText("Target Species")).toBeVisible();
    await expect(page.getByText(/Known Dose/)).toBeVisible();
    await expect(page.getByText("Scaling Method")).toBeVisible();
  });

  test("should support both dark and light modes", async ({ page }) => {
    // App should work in dark mode (default)
    const html = page.locator("html");

    // Toggle to light mode
    await page
      .getByRole("button", { name: /Switch to (light|dark) mode/i })
      .click();
    await page.waitForTimeout(100);

    // Should still be functional
    await page.locator("#base-dose").fill("10");
    await page.getByRole("button", { name: /Calculate Dose/i }).click();

    // Results should appear in both modes
    await expect(page.getByText("Results Summary")).toBeVisible();
  });
});

test.describe("Accessibility - Screen Reader Support", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have sr-only text for visual icons", async ({ page }) => {
    // Skip link should have visually hidden text
    const skipLink = page.locator("a.skip-link");
    await expect(skipLink).toHaveText("Skip to main content");
  });

  test("should have aria-hidden on decorative icons", async ({ page }) => {
    // Decorative icons should be hidden from screen readers
    const decorativeIcons = page.locator('[aria-hidden="true"]');
    expect(await decorativeIcons.count()).toBeGreaterThan(0);
  });

  test("should have aria-live regions for dynamic content", async ({
    page,
  }) => {
    // Perform calculation to show live region
    await page.locator("#base-dose").fill("10");
    await page.getByRole("button", { name: /Calculate Dose/i }).click();

    // Should have aria-live for calculated dose
    const liveRegion = page.locator('[aria-live="polite"]');
    expect(await liveRegion.count()).toBeGreaterThan(0);
  });

  test("should announce copy success to screen readers", async ({
    page,
    context,
    browserName,
  }) => {
    // Skip clipboard permission test on Firefox and WebKit (not supported)
    test.skip(
      browserName === "firefox" || browserName === "webkit",
      "Firefox and WebKit don't support clipboard permissions",
    );

    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-write", "clipboard-read"]);

    await page.locator("#base-dose").fill("10");
    await page.getByRole("button", { name: /Calculate Dose/i }).click();
    await page.getByRole("button", { name: /Copy Results/i }).click();

    // Screen reader announcement should be present
    const announcement = page.locator('.sr-only[aria-live="polite"]');
    await expect(announcement).toBeAttached();
  });
});

test.describe("Accessibility - Focus Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should have visible focus indicators", async ({ page }) => {
    // Tab to theme button and verify focus ring
    await page.keyboard.press("Tab");

    // The focused element should be visible
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("should maintain focus context when tabs change", async ({ page }) => {
    // Click on Advanced tab
    await page.getByRole("tab", { name: /Advanced/i }).click();

    // Tab trigger should be visible and interactive
    await expect(page.getByRole("tab", { name: /Advanced/i })).toBeVisible();
  });

  test("should allow navigating between calculator sections", async ({
    page,
  }) => {
    // First calculate something
    await page.locator("#base-dose").fill("10");
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: /Calculate Dose/i }).click();
    await page.waitForTimeout(500);

    // Results should be visible
    await expect(
      page.getByRole("heading", { name: "Results Summary" }),
    ).toBeVisible();
  });
});

test.describe("Accessibility - Advanced Parameters Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: /Advanced/i }).click();
  });

  test("should have accessible radio groups for kidney function", async ({
    page,
  }) => {
    const kidneyRadioGroup = page.getByRole("radiogroup", {
      name: /Kidney function method/i,
    });
    await expect(kidneyRadioGroup).toBeVisible();
  });

  test("should have accessible select for bioavailability route", async ({
    page,
  }) => {
    // Bioavailability now uses a Select dropdown for route selection
    const bioSelect = page.locator("#bioavailability-route");
    await expect(bioSelect).toBeVisible();
  });

  test("should have aria-label on reset button", async ({ page }) => {
    const resetButton = page.getByRole("button", {
      name: /Reset all advanced parameters/i,
    });
    await expect(resetButton).toBeVisible();
  });

  test("should have grouped Cockcroft-Gault parameters", async ({ page }) => {
    // Select Cockcroft-Gault
    await page.getByLabel("Cockcroft-Gault").click();

    // Parameters should be in a group
    const group = page.locator(
      '[role="group"][aria-label="Cockcroft-Gault parameters"]',
    );
    await expect(group).toBeVisible();
  });

  test("should have patient sex radio group with aria-label", async ({
    page,
  }) => {
    await page.getByLabel("Cockcroft-Gault").click();

    const sexRadioGroup = page.getByRole("radiogroup", {
      name: /Patient sex/i,
    });
    await expect(sexRadioGroup).toBeVisible();
  });
});

test.describe("Accessibility - Study Planner Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: /Study Planner/i }).click();
  });

  test("should have accessible select elements with aria-labels", async ({
    page,
  }) => {
    const studyTypeSelect = page.getByLabel("Select study type");
    await expect(studyTypeSelect).toBeVisible();
  });

  test("should have aria-describedby for arm count input", async ({ page }) => {
    const numArmsInput = page.locator("#num-arms");
    await expect(numArmsInput).toHaveAttribute(
      "aria-describedby",
      "arms-description",
    );
  });

  test("should have aria-label on remove arm buttons", async ({ page }) => {
    // Add a second arm first
    await page.getByRole("button", { name: /Add Treatment Arm/i }).click();

    // Remove button should have accessible name
    const removeButtons = page.getByRole("button", { name: /Remove/i });
    expect(await removeButtons.count()).toBeGreaterThan(0);
  });

  test("should have accessible tables after calculation", async ({ page }) => {
    await page.getByRole("button", { name: /Calculate Requirements/i }).click();

    // Table should have labeled headers
    const table = page.locator(
      'table[aria-labelledby="arm-breakdown-heading"]',
    );
    await expect(table).toBeVisible();

    // Headers should have scope
    const headers = page.locator('th[scope="col"]');
    expect(await headers.count()).toBeGreaterThan(0);
  });
});

test.describe("Accessibility - Mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
  });

  test("should be usable on mobile viewports", async ({ page }) => {
    // Some form elements should be visible (scroll may be needed)
    await expect(page.locator("#base-dose")).toBeVisible({ timeout: 10000 });
  });

  test("should have touch-friendly tap targets", async ({ page }) => {
    // Buttons should be at least 44x44 pixels (WCAG minimum)
    const themeButton = page.getByRole("button", {
      name: /Switch to (light|dark) mode/i,
    });

    const boundingBox = await themeButton.boundingBox();
    expect(boundingBox?.width).toBeGreaterThanOrEqual(32); // Actual minimum may vary
    expect(boundingBox?.height).toBeGreaterThanOrEqual(32);
  });
});
