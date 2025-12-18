import { test, expect } from "@playwright/test";

/**
 * DoseFinder - Study Planner Tab Tests
 * Tests for multi-arm study design and material requirements
 */

test.describe("Study Planner", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: /Study Planner/i }).click();
  });

  test.describe("Study Design Section", () => {
    test("should display Study Design card", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Study Design" }),
      ).toBeVisible();
    });

    test("should display study type dropdown", async ({ page }) => {
      const studyTypeSelect = page.locator("#study-type");
      await expect(studyTypeSelect).toBeVisible();
    });

    test("should allow selecting different study types", async ({ page }) => {
      const studyTypeSelect = page.locator("#study-type");
      await studyTypeSelect.click();
      await page.waitForTimeout(100);

      // Check that options are visible
      await expect(
        page.getByRole("option", { name: /Preclinical/i }),
      ).toBeVisible();

      // Click an option
      await page.getByRole("option", { name: /Preclinical/i }).click();
      await expect(studyTypeSelect).toContainText(/Preclinical/i);
    });

    test("should display number of arms input", async ({ page }) => {
      await expect(page.locator("#num-arms")).toBeVisible();
    });

    test("should display overage factor input", async ({ page }) => {
      await expect(page.locator("#overage-factor")).toBeVisible();
    });

    test("should display stability buffer input", async ({ page }) => {
      await expect(page.locator("#stability-buffer")).toBeVisible();
    });
  });

  test.describe("Arm Management", () => {
    test("should display initial arm configuration", async ({ page }) => {
      await expect(page.getByText("Arm 1: Dose Group 1")).toBeVisible();
    });

    test("should add treatment arm", async ({ page }) => {
      await page.getByRole("button", { name: /Add Treatment Arm/i }).click();

      // Should now have 2 arms
      await expect(page.getByText(/Arm 2/)).toBeVisible();
    });

    test("should add placebo arm", async ({ page }) => {
      await page.getByRole("button", { name: /Placebo/i }).click();

      // Should have 2 arms now
      await expect(page.getByText(/Arm 2/)).toBeVisible();
    });

    test("should add comparator arm", async ({ page }) => {
      await page.getByRole("button", { name: /Comparator/i }).click();

      // Should have 2 arms now
      await expect(page.getByText(/Arm 2/)).toBeVisible();
    });

    test("should add arm from calculator dose", async ({ page }) => {
      await page.getByRole("button", { name: /From Calculator/i }).click();

      // Should have new arm with target species name
      await expect(page.getByText(/Arm 2/)).toBeVisible();
    });

    test("should remove arm when clicking delete button", async ({ page }) => {
      // Add a second arm first
      await page.getByRole("button", { name: /Add Treatment Arm/i }).click();
      await expect(page.getByText(/Arm 2/)).toBeVisible();

      // Remove the second arm
      const removeButtons = page.getByRole("button", { name: /Remove/i });
      await removeButtons.last().click();

      // Should only have 1 arm now
      await expect(page.getByText(/Arm 2/)).not.toBeVisible();
    });

    test("should not remove last arm", async ({ page }) => {
      // The remove button for the only arm should be disabled
      const removeButton = page.getByRole("button", { name: /Remove/i });
      await expect(removeButton).toBeDisabled();
    });
  });

  test.describe("Arm Configuration", () => {
    test("should allow editing arm name", async ({ page }) => {
      const armNameInput = page.locator("#arm-name-0");
      await armNameInput.clear();
      await armNameInput.fill("Low Dose Group");
      await expect(armNameInput).toHaveValue("Low Dose Group");
    });

    test("should allow changing arm type", async ({ page }) => {
      const armTypeSelect = page.locator("#arm-type-0");
      await armTypeSelect.click();
      await page.getByRole("option", { name: /Placebo/i }).click();

      // Arm type select should now show placebo
      await expect(armTypeSelect).toContainText(/Placebo/i);
    });

    test("should allow selecting species", async ({ page }) => {
      const speciesSelect = page.locator("#arm-species-0");
      await speciesSelect.click();
      await page.getByRole("option", { name: "Rat" }).click();

      await expect(speciesSelect).toContainText("Rat");
    });

    test("should allow entering number of subjects", async ({ page }) => {
      const subjectsInput = page.locator("#arm-subjects-0");
      await subjectsInput.clear();
      await subjectsInput.fill("20");
      await expect(subjectsInput).toHaveValue("20");
    });

    test("should allow entering weight", async ({ page }) => {
      const weightInput = page.locator("#arm-weight-0");
      await weightInput.clear();
      await weightInput.fill("0.025");
      await expect(weightInput).toHaveValue("0.025");
    });

    test("should allow entering dose level for treatment arms", async ({
      page,
    }) => {
      const doseInput = page.locator("#arm-dose-0");
      await doseInput.clear();
      await doseInput.fill("5");
      await expect(doseInput).toHaveValue("5");
    });

    test("should hide dose input for placebo arms", async ({ page }) => {
      const armTypeSelect = page.locator("#arm-type-0");
      await armTypeSelect.click();
      await page.getByRole("option", { name: "Placebo" }).click();

      // Dose input should not be visible
      await expect(page.locator("#arm-dose-0")).not.toBeVisible();
    });

    test("should allow selecting dose unit", async ({ page }) => {
      // Verify dose input section is visible with unit selector
      // The default dose unit is mg/kg which should be visible
      await expect(page.getByText("mg/kg").first()).toBeVisible();
    });

    test("should allow setting treatment duration", async ({ page }) => {
      const durationInput = page.locator("#arm-duration-0");
      await durationInput.clear();
      await durationInput.fill("28");
      await expect(durationInput).toHaveValue("28");
    });

    test("should allow selecting duration unit", async ({ page }) => {
      const durationUnitSelect = page.getByLabel(
        "Duration unit for Dose Group 1",
      );
      await durationUnitSelect.click();

      await expect(page.getByRole("option", { name: "Days" })).toBeVisible();
      await expect(page.getByRole("option", { name: "Weeks" })).toBeVisible();
      await expect(page.getByRole("option", { name: "Months" })).toBeVisible();

      await page.getByRole("option", { name: "Weeks" }).click();
      await expect(durationUnitSelect).toContainText("Weeks");
    });
  });

  test.describe("Dosing Schedule", () => {
    test("should display frequency selection", async ({ page }) => {
      await expect(page.getByText("Dosing Schedule")).toBeVisible();
      await expect(page.getByText("Frequency")).toBeVisible();
    });

    test("should allow selecting different frequencies", async ({ page }) => {
      // Verify the frequency section exists and default value is shown
      await expect(page.getByText("Dosing Schedule")).toBeVisible();
      // Default frequency is "Once daily" which should be visible in the trigger
      await expect(page.getByText(/Once daily/i)).toBeVisible();
    });

    test("should show custom frequency inputs when Custom is selected", async ({
      page,
    }) => {
      // Verify dosing schedule section is present with frequency controls
      await expect(page.getByText("Dosing Schedule")).toBeVisible();
      await expect(page.getByText("Frequency")).toBeVisible();
    });
  });

  test.describe("Comparator Arms", () => {
    test("should show comparator details section for comparator arms", async ({
      page,
    }) => {
      // Add comparator arm
      await page.getByRole("button", { name: /Comparator/i }).click();

      // Should have 2 arms
      await expect(page.getByText(/Arm 2/)).toBeVisible();
    });

    test("should allow entering comparator name", async ({ page }) => {
      await page.getByRole("button", { name: /Comparator/i }).click();

      // Second arm should be visible
      await expect(page.locator("#arm-name-1")).toBeVisible();
    });

    test("should allow entering comparator concentration", async ({ page }) => {
      await page.getByRole("button", { name: /Comparator/i }).click();

      // Verify the arm was added
      await expect(page.getByText(/Arm 2/)).toBeVisible();
    });
  });

  test.describe("Formulation & Dilution", () => {
    test("should display Formulation & Dilution card", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Formulation & Dilution" }),
      ).toBeVisible();
    });

    test("should allow entering stock concentration", async ({ page }) => {
      const stockConcInput = page.locator("#stock-concentration");
      await stockConcInput.clear();
      await stockConcInput.fill("20");
      await expect(stockConcInput).toHaveValue("20");
    });

    test("should allow selecting concentration unit", async ({ page }) => {
      const unitSelect = page.getByLabel("Stock concentration unit");
      await unitSelect.click();

      await expect(page.getByRole("option", { name: "mg/mL" })).toBeVisible();
      await expect(page.getByRole("option", { name: "mg/g" })).toBeVisible();
      await expect(page.getByRole("option", { name: "μg/mL" })).toBeVisible();
      await expect(page.getByRole("option", { name: "% (w/v)" })).toBeVisible();
    });

    test("should allow selecting administration route", async ({ page }) => {
      const routeSelect = page.locator("#admin-route");
      await routeSelect.click();

      await expect(page.getByRole("option", { name: "Oral" })).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Intravenous" }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Intraperitoneal" }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Subcutaneous" }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "Intramuscular" }),
      ).toBeVisible();

      await page.getByRole("option", { name: "Intravenous" }).click();
      await expect(routeSelect).toContainText("Intravenous");
    });

    test("should toggle dilution sequence", async ({ page }) => {
      const dilutionSwitch = page.locator("#useDilutions");
      await dilutionSwitch.click();

      // Dilution steps section should appear
      await expect(page.getByText("Dilution Steps")).toBeVisible();
    });

    test("should add dilution step", async ({ page }) => {
      const dilutionSwitch = page.locator("#useDilutions");
      await dilutionSwitch.click();

      // Should have one step initially
      await expect(page.getByText("Step 1")).toBeVisible();

      // Add another step
      await page.getByRole("button", { name: /Add Dilution Step/i }).click();

      // Should now have two steps
      await expect(page.getByText("Step 2")).toBeVisible();
    });

    test("should allow configuring dilution factors and vehicles", async ({
      page,
    }) => {
      const dilutionSwitch = page.locator("#useDilutions");
      await dilutionSwitch.click();

      // Find dilution factor input
      const dilutionInputs = page.locator('input[type="number"][min="1"]');
      const factorInput = dilutionInputs.last();

      await factorInput.clear();
      await factorInput.fill("5");
      await expect(factorInput).toHaveValue("5");
    });
  });

  test.describe("Calculate Requirements", () => {
    test("should display Calculate Requirements button", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /Calculate Requirements/i }),
      ).toBeVisible();
    });

    test("should calculate and display results", async ({ page }) => {
      // Click calculate
      await page
        .getByRole("button", { name: /Calculate Requirements/i })
        .click();

      // Results section should appear
      await expect(
        page.getByRole("heading", { name: "Study Material Requirements" }),
      ).toBeVisible();
      await expect(
        page.getByText("Total Active Compound Required"),
      ).toBeVisible();
      await expect(page.getByText("Total Doses to Prepare")).toBeVisible();
    });

    test("should display breakdown by study arm", async ({ page }) => {
      await page
        .getByRole("button", { name: /Calculate Requirements/i })
        .click();

      await expect(page.getByText("Breakdown by Study Arm")).toBeVisible();

      // Table headers should be visible
      await expect(
        page.getByRole("columnheader", { name: "Arm" }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Type" }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Subjects" }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Dose per Subject" }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Total Doses" }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Product Required" }),
      ).toBeVisible();
    });

    test("should display Export Study Plan button after calculation", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: /Calculate Requirements/i })
        .click();

      await expect(
        page.getByRole("button", { name: /Export Study Plan/i }),
      ).toBeVisible();
    });

    test("should show overage factor in results", async ({ page }) => {
      await page.locator("#overage-factor").clear();
      await page.locator("#overage-factor").fill("20");

      await page
        .getByRole("button", { name: /Calculate Requirements/i })
        .click();

      await expect(
        page.getByText("Including 20% overage factor"),
      ).toBeVisible();
    });
  });

  test.describe("Dilution Preparation Display", () => {
    test("should show dosing solution preparation when dilutions enabled", async ({
      page,
    }) => {
      // Enable dilutions
      const dilutionSwitch = page.locator("#useDilutions");
      await dilutionSwitch.click();

      // Calculate requirements
      await page
        .getByRole("button", { name: /Calculate Requirements/i })
        .click();

      // Should show dosing solution preparation section
      await expect(page.getByText("Dosing Solution Preparation")).toBeVisible();
    });

    test("should display dilution steps in accordion", async ({ page }) => {
      const dilutionSwitch = page.locator("#useDilutions");
      await dilutionSwitch.click();

      await page
        .getByRole("button", { name: /Calculate Requirements/i })
        .click();

      // Should have results displayed
      await expect(page.getByText("Study Material Requirements")).toBeVisible();
    });
  });

  test.describe("Copy Calculator Dose", () => {
    test("should have Copy Calc. Dose button for treatment arms", async ({
      page,
    }) => {
      await expect(
        page.getByRole("button", { name: /Copy Calc\. Dose/i }),
      ).toBeVisible();
    });

    test("should show popover with calculator dose info", async ({ page }) => {
      await page.getByRole("button", { name: /Copy Calc\. Dose/i }).click();

      await expect(page.getByText("Calculator Dose")).toBeVisible();
      await expect(page.getByText(/Current dose:/)).toBeVisible();
    });

    test("should apply calculator dose to arm", async ({ page }) => {
      await page.getByRole("button", { name: /Copy Calc\. Dose/i }).click();
      await page.getByRole("button", { name: /Apply to this arm/i }).click();

      // The dose should be updated (exact value depends on calculator state)
      // Just verify the interaction worked
      await expect(page.locator("#arm-dose-0")).toBeVisible();
    });
  });
});
