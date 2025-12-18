import { test, expect } from "@playwright/test";

/**
 * DoseFinder - Advanced Parameters Tab Tests
 * Tests for kidney function and bioavailability settings
 */

test.describe("Advanced Parameters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: /Advanced/i }).click();
  });

  test.describe("Page Layout", () => {
    test("should display Reset All button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /Reset All/i }),
      ).toBeVisible();
    });

    test("should display Kidney Function card", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Kidney Function" }),
      ).toBeVisible();
    });

    test("should display Bioavailability card", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Bioavailability" }),
      ).toBeVisible();
    });

    test("should display Active Parameter Effects section", async ({
      page,
    }) => {
      await expect(page.getByText("Active Parameter Effects")).toBeVisible();
    });

    test("should display note about removed parameters", async ({ page }) => {
      await expect(page.getByText("Note on Removed Parameters")).toBeVisible();
      await expect(
        page.getByText("Protein binding, volume of distribution"),
      ).toBeVisible();
    });
  });

  test.describe("Kidney Function Methods", () => {
    test("should display all kidney function options", async ({ page }) => {
      await expect(page.getByLabel("None")).toBeVisible();
      await expect(page.getByLabel("Manual %")).toBeVisible();
      await expect(page.getByLabel("Cockcroft-Gault")).toBeVisible();
    });

    test("should have None selected by default", async ({ page }) => {
      await expect(page.locator("#kf-none")).toBeChecked();
    });

    test("should show manual input when Manual % is selected", async ({
      page,
    }) => {
      await page.getByLabel("Manual %").click();

      const manualInput = page.locator("#kidney-function-manual");
      await expect(manualInput).toBeVisible();

      // Enter a value
      await manualInput.fill("75");
      await expect(manualInput).toHaveValue("75");
    });

    test("should show Cockcroft-Gault parameters when selected", async ({
      page,
    }) => {
      await page.locator("#kf-cg").click();

      // Check for CG parameters
      await expect(page.locator("#patient-age")).toBeVisible();
      await expect(page.locator("#patient-creatinine")).toBeVisible();
      await expect(page.locator("#sex-male")).toBeVisible();
      await expect(page.locator("#sex-female")).toBeVisible();
    });

    test("should allow entering Cockcroft-Gault parameters", async ({
      page,
    }) => {
      await page.getByLabel("Cockcroft-Gault").click();

      // Enter age
      await page.locator("#patient-age").fill("55");
      await expect(page.locator("#patient-age")).toHaveValue("55");

      // Enter creatinine
      await page.locator("#patient-creatinine").fill("1.2");
      await expect(page.locator("#patient-creatinine")).toHaveValue("1.2");

      // Select sex
      await page.getByLabel("Female").click();
      await expect(page.locator("#sex-female")).toBeChecked();
    });

    test("should update active effects when kidney function is set", async ({
      page,
    }) => {
      await page.getByLabel("Manual %").click();
      await page.locator("#kidney-function-manual").fill("60");

      // Check that effect is shown
      await expect(
        page.getByText(/Reduced kidney function.*60%/),
      ).toBeVisible();
    });
  });

  test.describe("Bioavailability Methods", () => {
    test("should display all bioavailability options", async ({ page }) => {
      await expect(page.getByLabel("Manual (%)")).toBeVisible();
      await expect(page.getByLabel("IV (100%)")).toBeVisible();
      await expect(page.getByLabel("Oral (~50%)")).toBeVisible();
      await expect(page.getByLabel("Other (~75%)")).toBeVisible();
    });

    test("should show manual input when Manual is selected", async ({
      page,
    }) => {
      await page.getByLabel("Manual (%)").click();

      const manualInput = page.locator("#bioavailability-manual");
      await expect(manualInput).toBeVisible();

      // Enter a value
      await manualInput.fill("80");
      await expect(manualInput).toHaveValue("80");
    });

    test("should update active effects for IV", async ({ page }) => {
      await page.getByLabel("IV (100%)").click();

      // Should show no adjustments for IV
      await expect(
        page.getByText(
          "No adjustments currently active (IV = 100% bioavailability)",
        ),
      ).toBeVisible();
    });

    test("should update active effects for Oral", async ({ page }) => {
      await page.getByLabel("Oral (~50%)").click();

      // Should show 2x adjustment factor
      await expect(
        page.getByText("Bioavailability adjustment factor: 2x"),
      ).toBeVisible();
    });

    test("should update active effects for Other", async ({ page }) => {
      await page.getByLabel("Other (~75%)").click();

      // Should show 1.33x adjustment factor
      await expect(
        page.getByText("Bioavailability adjustment factor: 1.33x"),
      ).toBeVisible();
    });

    test("should calculate custom bioavailability adjustment", async ({
      page,
    }) => {
      await page.getByLabel("Manual (%)").click();
      await page.locator("#bioavailability-manual").fill("50");

      // Should show 2x adjustment factor (100/50)
      await expect(
        page.getByText("Bioavailability adjustment factor: 2.00x"),
      ).toBeVisible();
    });
  });

  test.describe("Reset Functionality", () => {
    test("should have reset button available", async ({ page }) => {
      // Reset button should be visible
      const resetButton = page.getByRole("button", { name: /Reset All/i });
      await expect(resetButton).toBeVisible();

      // Click it
      await resetButton.click();
      await page.waitForTimeout(200);

      // Page should still be functional - heading is visible
      await expect(
        page.getByRole("heading", { name: "Kidney Function" }),
      ).toBeVisible();
    });
  });

  test.describe("Integration with Calculator", () => {
    test("should affect dose calculation when parameters are changed", async ({
      page,
    }) => {
      // First, perform a calculation on the calculator tab
      await page.getByRole("tab", { name: /Calculator/i }).click();
      await page.locator("#base-dose").fill("10");
      await page.getByRole("button", { name: /Calculate Dose/i }).click();

      // Get initial result
      const initialResult = await page
        .locator(".result-value.text-accent")
        .first()
        .textContent();

      // Go to advanced tab and change bioavailability
      await page.getByRole("tab", { name: /Advanced/i }).click();
      await page.locator("#bio-oral").click();

      // Go back to calculator and recalculate
      await page.getByRole("tab", { name: /Calculator/i }).click();
      await page.getByRole("button", { name: /Calculate Dose/i }).click();

      // Get new result
      const newResult = await page
        .locator(".result-value.text-accent")
        .first()
        .textContent();

      // Results should be different due to bioavailability adjustment
      expect(initialResult).not.toBe(newResult);
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper form field labels", async ({ page }) => {
      await page.locator("#kf-cg").click();
      await page.waitForTimeout(100);

      // Check age and creatinine inputs are visible
      await expect(page.locator("#patient-age")).toBeVisible();
      await expect(page.locator("#patient-creatinine")).toBeVisible();
    });

    test("should have fieldset legends for radio groups", async ({ page }) => {
      // The kidney function radio group should have a legend
      const kidneyFieldset = page
        .locator("fieldset")
        .filter({ hasText: "Kidney function" });
      await expect(kidneyFieldset).toBeVisible();

      // The bioavailability radio group should have a legend
      const bioFieldset = page
        .locator("fieldset")
        .filter({ hasText: "Bioavailability" });
      await expect(bioFieldset).toBeVisible();
    });

    test("should have aria labels on radio groups", async ({ page }) => {
      const kidneyRadioGroup = page.getByRole("radiogroup", {
        name: /Kidney function method/i,
      });
      await expect(kidneyRadioGroup).toBeVisible();

      const bioRadioGroup = page.getByRole("radiogroup", {
        name: /Bioavailability calculation method/i,
      });
      await expect(bioRadioGroup).toBeVisible();
    });
  });
});
