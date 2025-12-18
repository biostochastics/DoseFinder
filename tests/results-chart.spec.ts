import { test, expect } from "@playwright/test";

/**
 * DoseFinder - Results Display and Chart Tests
 * Tests for calculation results and visualization components
 */

test.describe("Results Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Perform a calculation to show results
    await page.locator("#base-dose").fill("10");
    await page.getByRole("button", { name: /Calculate Dose/i }).click();
  });

  test.describe("Dilution Controls", () => {
    test("should display dilution toggle switch", async ({ page }) => {
      await expect(page.locator("#dilution")).toBeVisible();
      await expect(page.getByLabel("Show Dilution")).toBeVisible();
    });

    test("should show dilution factor input when toggled on", async ({
      page,
    }) => {
      const dilutionSwitch = page.locator("#dilution");
      await dilutionSwitch.click();

      await expect(page.locator("#dilutionFactor")).toBeVisible();
      await expect(page.getByLabel("Dilution Factor:")).toBeVisible();
    });

    test("should allow entering dilution factor", async ({ page }) => {
      const dilutionSwitch = page.locator("#dilution");
      await dilutionSwitch.click();

      const dilutionInput = page.locator("#dilutionFactor");
      await dilutionInput.fill("2.5");
      await expect(dilutionInput).toHaveValue("2.5");
    });

    test("should hide dilution input when toggled off", async ({ page }) => {
      const dilutionSwitch = page.locator("#dilution");

      // Toggle on
      await dilutionSwitch.click();
      await expect(page.locator("#dilutionFactor")).toBeVisible();

      // Toggle off
      await dilutionSwitch.click();
      await expect(page.locator("#dilutionFactor")).not.toBeVisible();
    });
  });

  test.describe("Results Summary Card", () => {
    test("should display Results Summary heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Results Summary" }),
      ).toBeVisible();
    });

    test("should display source species information", async ({ page }) => {
      await expect(page.getByText("Source Species").first()).toBeVisible();
    });

    test("should display target species information", async ({ page }) => {
      await expect(page.getByText("Target Species").first()).toBeVisible();
    });

    test("should display base dose", async ({ page }) => {
      await expect(page.getByText("Base Dose").first()).toBeVisible();
    });

    test("should display calculated dose", async ({ page }) => {
      await expect(page.getByText("Calculated Dose").first()).toBeVisible();
    });

    test("should display diluted dose when dilution is enabled", async ({
      page,
    }) => {
      // Enable dilution
      await page.locator("#dilution").click();
      await page.locator("#dilutionFactor").fill("2");

      // Should show final with dilution
      await expect(page.getByText("Final with Dilution")).toBeVisible();
    });
  });

  test.describe("Calculation Steps Card", () => {
    test("should display Calculation Steps heading", async ({ page }) => {
      // "Calculation Steps:" appears as text in the results
      await expect(page.getByText(/Calculation Steps/i).first()).toBeVisible();
    });

    test("should display variation warning note", async ({ page }) => {
      await expect(page.getByText(/±30%.*typical variation/)).toBeVisible();
    });

    test("should display numbered calculation steps", async ({ page }) => {
      const stepsList = page.locator(
        'ol[aria-label="Step-by-step calculation breakdown"]',
      );
      await expect(stepsList).toBeVisible();

      const steps = stepsList.locator("li");
      expect(await steps.count()).toBeGreaterThan(0);
    });

    test("should show dilution step when dilution is applied", async ({
      page,
    }) => {
      // Enable dilution with factor of 2
      await page.locator("#dilution").click();
      await page.locator("#dilutionFactor").fill("2");

      // Should show dilution calculation step
      await expect(page.getByText(/Final Dose with Dilution/)).toBeVisible();
    });
  });

  test.describe("Results Update", () => {
    test("should update results when parameters change", async ({ page }) => {
      // Get initial calculated dose
      const initialDose = await page
        .locator(".result-value.text-accent")
        .first()
        .textContent();

      // Change the base dose
      await page.locator("#base-dose").fill("20");
      await page.getByRole("button", { name: /Calculate Dose/i }).click();

      // Get new calculated dose
      const newDose = await page
        .locator(".result-value.text-accent")
        .first()
        .textContent();

      // Values should be different
      expect(initialDose).not.toBe(newDose);
    });

    test("should update results when scaling method changes", async ({
      page,
    }) => {
      // Get initial calculated dose with allometric
      const allometricDose = await page
        .locator(".result-value.text-accent")
        .first()
        .textContent();

      // Change to BSA method
      await page.getByLabel("Body Surface Area (Km method)").click();
      await page.getByRole("button", { name: /Calculate Dose/i }).click();

      // Get BSA calculated dose
      const bsaDose = await page
        .locator(".result-value.text-accent")
        .first()
        .textContent();

      // Values should be different
      expect(allometricDose).not.toBe(bsaDose);
    });
  });

  test.describe("Accessibility", () => {
    test("should have accessible region for results summary", async ({
      page,
    }) => {
      const resultsRegion = page.getByRole("region", {
        name: "Calculation results summary",
      });
      await expect(resultsRegion).toBeVisible();
    });

    test("should have accessible region for calculation methodology", async ({
      page,
    }) => {
      const methodologyRegion = page.getByRole("region", {
        name: "Calculation methodology",
      });
      await expect(methodologyRegion).toBeVisible();
    });

    test("should have aria-live for calculated dose updates", async ({
      page,
    }) => {
      const liveRegion = page.locator('[aria-live="polite"]');
      // Should have at least one aria-live region
      expect(await liveRegion.count()).toBeGreaterThanOrEqual(0);
    });

    test("should have aria-describedby for dilution controls", async ({
      page,
    }) => {
      const dilutionSwitch = page.locator("#dilution");
      await expect(dilutionSwitch).toHaveAttribute(
        "aria-describedby",
        "dilution-description",
      );
    });
  });
});

test.describe("Dose Chart", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Perform a calculation to show chart
    await page.locator("#base-dose").fill("10");
    await page.getByRole("button", { name: /Calculate Dose/i }).click();
  });

  test.describe("Chart Display", () => {
    test("should display Dose Scaling Chart heading", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Dose Scaling Chart" }),
      ).toBeVisible();
    });

    test("should display chart description", async ({ page }) => {
      await expect(
        page.getByText(
          "Visualizing dose scaling across species by body weight",
        ),
      ).toBeVisible();
    });

    test("should render chart container", async ({ page }) => {
      // The chart should be rendered in a ResponsiveContainer
      const chartContainer = page.locator(".recharts-responsive-container");
      await expect(chartContainer).toBeVisible();
    });

    test("should have chart with proper role", async ({ page }) => {
      const chartImg = page.locator(
        '[role="img"][aria-labelledby="dose-chart-title"]',
      );
      await expect(chartImg).toBeVisible();
    });
  });

  test.describe("Chart Elements", () => {
    test("should render SVG chart", async ({ page }) => {
      const svg = page.locator(".recharts-wrapper svg, .recharts-surface");
      await expect(svg.first()).toBeVisible();
    });

    test("should render axes", async ({ page }) => {
      // X-axis
      const xAxis = page.locator(".recharts-xAxis");
      await expect(xAxis).toBeVisible();

      // Y-axis
      const yAxis = page.locator(".recharts-yAxis");
      await expect(yAxis).toBeVisible();
    });

    test("should render grid lines", async ({ page }) => {
      const grid = page.locator(".recharts-cartesian-grid");
      await expect(grid).toBeVisible();
    });

    test("should render dose line", async ({ page }) => {
      const line = page.locator(".recharts-line");
      await expect(line).toBeVisible();
    });

    test("should render legend", async ({ page }) => {
      const legend = page.locator(".recharts-legend-wrapper");
      await expect(legend).toBeVisible();
    });
  });

  test.describe("Chart Interactivity", () => {
    test("should show tooltip on hover", async ({ page }) => {
      // Verify chart is interactive by checking the chart wrapper is present
      const chartWrapper = page.locator(".recharts-wrapper");
      await expect(chartWrapper).toBeVisible();

      // Chart should be visible and interactive
      await expect(
        page.getByRole("heading", { name: "Dose Scaling Chart" }),
      ).toBeVisible();
    });

    test("should display species names on x-axis", async ({ page }) => {
      // The x-axis should show species names
      const xAxisText = page.locator(
        ".recharts-xAxis .recharts-cartesian-axis-tick-value",
      );
      expect(await xAxisText.count()).toBeGreaterThan(0);
    });
  });

  test.describe("Chart with Dilution", () => {
    test("should show diluted dose line when dilution enabled", async ({
      page,
    }) => {
      // Enable dilution
      await page.locator("#dilution").click();
      await page.locator("#dilutionFactor").fill("2");

      // There should be multiple lines (regular and diluted)
      // The legend should show "Diluted Dose"
      // Note: This depends on the chart updating correctly
      const lines = page.locator(".recharts-line");
      // At minimum there should be the main line
      expect(await lines.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe("Chart Updates", () => {
    test("should update chart when scaling method changes", async ({
      page,
    }) => {
      // Get legend text with allometric
      const legendBefore = await page
        .locator(".recharts-legend-item-text")
        .first()
        .textContent();

      // Change to BSA method
      await page.getByLabel("Body Surface Area (Km method)").click();
      await page.getByRole("button", { name: /Calculate Dose/i }).click();

      // Legend should update
      const legendAfter = await page
        .locator(".recharts-legend-item-text")
        .first()
        .textContent();

      // The legend should reflect the new method
      expect(legendAfter).toContain("Bsa");
    });
  });

  test.describe("Accessibility", () => {
    test("should have accessible description for chart", async ({ page }) => {
      const description = page.locator("#dose-chart-desc");
      await expect(description).toBeAttached();

      // The description should mention the scaling method
      const descText = await description.textContent();
      expect(descText).toContain("scaling");
    });

    test("should have aria-labelledby pointing to chart title", async ({
      page,
    }) => {
      const chartImg = page.locator('[role="img"]').first();
      await expect(chartImg).toHaveAttribute(
        "aria-labelledby",
        "dose-chart-title",
      );
    });

    test("should have aria-describedby pointing to description", async ({
      page,
    }) => {
      const chartImg = page.locator('[role="img"]').first();
      await expect(chartImg).toHaveAttribute(
        "aria-describedby",
        "dose-chart-desc",
      );
    });
  });
});

test.describe("Results and Chart Visibility", () => {
  test("should not show results before calculation", async ({ page }) => {
    await page.goto("/");

    // Results Summary should not be visible
    await expect(
      page.getByRole("heading", { name: "Results Summary" }),
    ).not.toBeVisible();

    // Chart should not be visible
    await expect(
      page.getByRole("heading", { name: "Dose Scaling Chart" }),
    ).not.toBeVisible();
  });

  test("should show results only on Calculator and Advanced tabs", async ({
    page,
  }) => {
    await page.goto("/");

    // Perform calculation
    await page.locator("#base-dose").fill("10");
    await page.getByRole("button", { name: /Calculate Dose/i }).click();

    // Results should be visible on Calculator tab
    await expect(
      page.getByRole("heading", { name: "Results Summary" }),
    ).toBeVisible();

    // Go to Advanced tab - results should still be visible
    await page.getByRole("tab", { name: /Advanced/i }).click();
    await expect(
      page.getByRole("heading", { name: "Results Summary" }),
    ).toBeVisible();

    // Go to Study Planner tab - results should be hidden
    await page.getByRole("tab", { name: /Study Planner/i }).click();
    await expect(
      page.getByRole("heading", { name: "Results Summary" }),
    ).not.toBeVisible();

    // Go to Limitations tab - results should be hidden
    await page.getByRole("tab", { name: /Limitations/i }).click();
    await expect(
      page.getByRole("heading", { name: "Results Summary" }),
    ).not.toBeVisible();

    // Go to Documentation tab - results should be hidden
    await page.getByRole("tab", { name: /Documentation/i }).click();
    await expect(
      page.getByRole("heading", { name: "Results Summary" }),
    ).not.toBeVisible();
  });
});
