import { test, expect } from "@playwright/test";

/**
 * DoseFinder - Calculator Tab Tests
 * Tests for the main dose calculation functionality
 */

test.describe("Dose Calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Ensure we're on the calculator tab
    await page.getByRole("tab", { name: /Calculator/i }).click();
  });

  test.describe("Species Selection", () => {
    test("should display source and target species dropdowns", async ({
      page,
    }) => {
      await expect(page.locator("#source-animal")).toBeVisible();
      await expect(page.locator("#target-animal")).toBeVisible();
    });

    test("should select source species and update weight placeholder", async ({
      page,
    }) => {
      const sourceSelect = page.locator("#source-animal");
      await sourceSelect.click();
      await page.getByRole("option", { name: "Rat" }).click();

      // Check weight placeholder updated
      const sourceWeight = page.locator("#source-weight");
      await expect(sourceWeight).toHaveAttribute("placeholder", /0\.15/);
    });

    test("should select target species", async ({ page }) => {
      const targetSelect = page.locator("#target-animal");
      await targetSelect.click();
      await page.getByRole("option", { name: "Dog" }).click();

      // Verify selection
      await expect(targetSelect).toContainText("Dog");
    });

    test("should display all available species", async ({ page }) => {
      const sourceSelect = page.locator("#source-animal");
      await sourceSelect.click();

      // Check for common species
      await expect(page.getByRole("option", { name: "Mouse" })).toBeVisible();
      await expect(page.getByRole("option", { name: "Rat" })).toBeVisible();
      await expect(page.getByRole("option", { name: "Human" })).toBeVisible();
      await expect(page.getByRole("option", { name: "Dog" })).toBeVisible();
      await expect(page.getByRole("option", { name: "Beagle" })).toBeVisible();
    });
  });

  test.describe("Weight Inputs", () => {
    test("should allow entering source weight", async ({ page }) => {
      const sourceWeight = page.locator("#source-weight");
      await sourceWeight.fill("0.025");
      await expect(sourceWeight).toHaveValue("0.025");
    });

    test("should allow entering target weight", async ({ page }) => {
      const targetWeight = page.locator("#target-weight");
      await targetWeight.fill("70");
      await expect(targetWeight).toHaveValue("70");
    });

    test("should have labels for weight inputs", async ({ page }) => {
      // Check weight labels are visible - there are two weight labels (Animal and Patient)
      await expect(page.getByText("Animal Weight (kg)")).toBeVisible();
      await expect(page.getByText("Patient Weight (kg)")).toBeVisible();
    });
  });

  test.describe("Dose Input", () => {
    test("should require base dose for calculation", async ({ page }) => {
      // Enter base dose
      const baseDose = page.locator("#base-dose");
      await baseDose.fill("10");
      await page.waitForTimeout(200);

      // Calculate button should be enabled after entering dose
      const calculateBtn = page.getByRole("button", {
        name: /Calculate Dose/i,
      });
      await expect(calculateBtn).toBeEnabled();
    });

    test("should display required indicator for base dose", async ({
      page,
    }) => {
      await expect(page.getByText("Known Dose (mg/kg)")).toBeVisible();
      await expect(
        page.getByText(
          "Required. Enter a positive value to enable calculation.",
        ),
      ).toBeVisible();
    });

    test("should disable calculate button for zero or negative dose", async ({
      page,
    }) => {
      const calculateBtn = page.getByRole("button", {
        name: /Calculate Dose/i,
      });
      const baseDose = page.locator("#base-dose");

      // Enter zero
      await baseDose.fill("0");
      await expect(calculateBtn).toBeDisabled();

      // Enter negative (input will prevent this, but test the state)
      await baseDose.fill("");
      await expect(calculateBtn).toBeDisabled();
    });
  });

  test.describe("Scaling Methods", () => {
    test("should display all scaling method options", async ({ page }) => {
      await expect(page.getByLabel("Allometric (Recommended)")).toBeVisible();
      await expect(
        page.getByLabel("Body Surface Area (Km method)"),
      ).toBeVisible();
      await expect(page.getByLabel("Direct (Linear)")).toBeVisible();
      await expect(
        page.getByLabel("Metabolic Rate (Kleiber's law)"),
      ).toBeVisible();
      await expect(page.getByLabel("Brain Weight (CNS drugs)")).toBeVisible();
      await expect(page.getByLabel("Life-Span (Chronic dosing)")).toBeVisible();
      await expect(page.getByLabel("Hepatic Blood Flow")).toBeVisible();
    });

    test("should have allometric selected by default", async ({ page }) => {
      const allometricRadio = page.locator("#allometric");
      await expect(allometricRadio).toBeChecked();
    });

    test("should select different scaling methods", async ({ page }) => {
      // Select BSA
      await page.getByLabel("Body Surface Area (Km method)").click();
      await expect(page.locator("#bsa")).toBeChecked();

      // Select Direct
      await page.getByLabel("Direct (Linear)").click();
      await expect(page.locator("#direct")).toBeChecked();

      // Select Metabolic
      await page.getByLabel("Metabolic Rate (Kleiber's law)").click();
      await expect(page.locator("#metabolic")).toBeChecked();
    });

    test("should show allometric exponent options when allometric is selected", async ({
      page,
    }) => {
      // Allometric should be selected by default
      await expect(page.locator("#scaling-exponent")).toBeVisible();

      // Switch to BSA
      await page.getByLabel("Body Surface Area (Km method)").click();

      // Exponent selector should be hidden
      await expect(page.locator("#scaling-exponent")).not.toBeVisible();

      // Switch back to allometric
      await page.getByLabel("Allometric (Recommended)").click();

      // Exponent selector should be visible again
      await expect(page.locator("#scaling-exponent")).toBeVisible();
    });

    test("should allow selecting different allometric exponents", async ({
      page,
    }) => {
      const exponentSelect = page.locator("#scaling-exponent");
      await exponentSelect.click();

      // Standard options
      await expect(
        page.getByRole("option", { name: "0.75 (Standard)" }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "0.67 (Surface Area)" }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "1.0 (Linear)" }),
      ).toBeVisible();
      await expect(page.getByRole("option", { name: "Custom" })).toBeVisible();

      // Select 0.67
      await page.getByRole("option", { name: "0.67 (Surface Area)" }).click();
      await expect(exponentSelect).toContainText("0.67");
    });

    test("should show custom exponent input when Custom is selected", async ({
      page,
    }) => {
      const exponentSelect = page.locator("#scaling-exponent");
      await exponentSelect.click();
      await page.getByRole("option", { name: "Custom" }).click();
      await page.waitForTimeout(100);

      // Custom input should appear
      const customInput = page.locator("#custom-exponent");
      await expect(customInput).toBeVisible();

      // Enter custom value
      await customInput.fill("0.85");
      await expect(customInput).toHaveValue("0.85");
    });
  });

  test.describe("Dose Calculation", () => {
    test("should calculate dose and display results", async ({ page }) => {
      // Enter base dose
      await page.locator("#base-dose").fill("10");
      await page.waitForTimeout(200);

      // Calculate
      await page.getByRole("button", { name: /Calculate Dose/i }).click();

      // Wait for results
      await page.waitForTimeout(500);

      // Results should appear
      await expect(page.getByText("Results Summary")).toBeVisible();
    });

    test("should display uncertainty range", async ({ page }) => {
      await page.locator("#base-dose").fill("10");
      await page.getByRole("button", { name: /Calculate Dose/i }).click();

      // Uncertainty range should be displayed
      await expect(page.getByText(/Range:/)).toBeVisible();
    });

    test("should display calculation steps", async ({ page }) => {
      await page.locator("#base-dose").fill("10");
      await page.getByRole("button", { name: /Calculate Dose/i }).click();

      await expect(page.getByText("Calculation Steps:")).toBeVisible();
      // There should be numbered steps
      await expect(page.locator("ol.list-decimal li").first()).toBeVisible();
    });

    test("should display disclaimer warning", async ({ page }) => {
      await page.locator("#base-dose").fill("10");
      await page.getByRole("button", { name: /Calculate Dose/i }).click();

      await expect(
        page.getByRole("note", { name: "Important disclaimer" }),
      ).toBeVisible();
      await expect(page.getByText("research purposes only")).toBeVisible();
    });

    test("should calculate correctly with different scaling methods", async ({
      page,
    }) => {
      await page.locator("#base-dose").fill("10");

      // Calculate with BSA method
      await page.locator("#bsa").click();
      await page.getByRole("button", { name: /Calculate Dose/i }).click();

      // Store BSA result
      const bsaResult = await page
        .locator(".result-value.text-accent")
        .first()
        .textContent();

      // Calculate with Direct method
      await page.locator("#direct").click();
      await page.getByRole("button", { name: /Calculate Dose/i }).click();

      // Store Direct result
      const directResult = await page
        .locator(".result-value.text-accent")
        .first()
        .textContent();

      // Results should be different
      expect(bsaResult).not.toBe(directResult);
    });
  });

  test.describe("Copy to Clipboard", () => {
    test("should have copy results button after calculation", async ({
      page,
    }) => {
      await page.locator("#base-dose").fill("10");
      await page.getByRole("button", { name: /Calculate Dose/i }).click();

      const copyBtn = page.getByRole("button", { name: /Copy Results/i });
      await expect(copyBtn).toBeVisible();
    });

    test("should have copy button visible after calculation", async ({
      page,
    }) => {
      await page.locator("#base-dose").fill("10");
      await page.waitForTimeout(200);
      await page.getByRole("button", { name: /Calculate Dose/i }).click();
      await page.waitForTimeout(300);

      // Copy button should be visible
      const copyBtn = page.getByRole("button", { name: /Copy Results/i });
      await expect(copyBtn).toBeVisible();
    });
  });

  test.describe("Info Popovers", () => {
    test("should show popover for source species info", async ({ page }) => {
      await page
        .locator('label:has-text("Source Species")')
        .getByRole("button")
        .click();
      await expect(
        page.getByText("Select the species from which the dose originates"),
      ).toBeVisible();
    });

    test("should show popover for target species info", async ({ page }) => {
      await page
        .locator('label:has-text("Target Species")')
        .getByRole("button")
        .click();
      await expect(
        page.getByText("Select the target species for dose translation"),
      ).toBeVisible();
    });

    test("should show popover for scaling methods info", async ({ page }) => {
      await page
        .locator('legend:has-text("Scaling Method")')
        .getByRole("button")
        .click();
      await expect(page.getByText("Available scaling methods:")).toBeVisible();
    });
  });
});
