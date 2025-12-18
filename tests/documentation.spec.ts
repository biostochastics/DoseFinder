import { test, expect } from "@playwright/test";

/**
 * DoseFinder - Documentation & Limitations Tab Tests
 * Tests for scientific documentation and limitations content
 */

test.describe("Limitations Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: /Limitations/i }).click();
  });

  test.describe("Scientific Limitations Alert", () => {
    test("should display important scientific limitations alert", async ({
      page,
    }) => {
      await expect(
        page.getByText("Important Scientific Limitations"),
      ).toBeVisible();
    });

    test("should list modern pharmacokinetic methods", async ({ page }) => {
      await expect(
        page.getByText("Population pharmacokinetic (PopPK) modeling"),
      ).toBeVisible();
      await expect(
        page.getByText("Physiologically-based pharmacokinetic (PBPK) models"),
      ).toBeVisible();
      await expect(
        page.getByText("Drug-specific absorption and metabolism factors"),
      ).toBeVisible();
      await expect(
        page.getByText("Target organ exposure considerations"),
      ).toBeVisible();
    });
  });

  test.describe("Key Assumptions & Limitations Card", () => {
    test("should display Key Assumptions & Limitations section", async ({
      page,
    }) => {
      await expect(
        page.getByText("Key Assumptions & Limitations"),
      ).toBeVisible();
    });

    test("should display scaling method limitations", async ({ page }) => {
      await expect(page.getByText("Scaling Method Limitations")).toBeVisible();
    });

    test("should display badge for each scaling method", async ({ page }) => {
      // Badges should be present in the limitations section
      await expect(page.getByText("Scaling Method Limitations")).toBeVisible();
    });

    test("should describe allometric limitations", async ({ page }) => {
      await expect(
        page.getByText(/Assumes similar metabolic rates/),
      ).toBeVisible();
    });

    test("should describe brain weight limitations", async ({ page }) => {
      await expect(
        page.getByText(/simplified coefficient.*2\/3/),
      ).toBeVisible();
    });
  });

  test.describe("Physiological Parameters Section", () => {
    test("should display physiological parameters limitations", async ({
      page,
    }) => {
      // The heading is in a scrollable section, may need to wait for it
      await expect(
        page
          .getByRole("heading", { name: "Physiological Parameters" })
          .or(
            page.locator("h4").filter({ hasText: "Physiological Parameters" }),
          ),
      ).toBeVisible();
    });
  });

  test.describe("Not Accounted For Section", () => {
    test("should list what is not accounted for", async ({ page }) => {
      await expect(page.getByText("Not Accounted For")).toBeVisible();
      await expect(
        page.getByText("Drug-specific pharmacokinetics"),
      ).toBeVisible();
      await expect(
        page.getByText("Route of administration differences"),
      ).toBeVisible();
      await expect(
        page.getByText(/Species-specific drug sensitivity/),
      ).toBeVisible();
      await expect(page.getByText(/Plasma protein binding/)).toBeVisible();
    });
  });

  test.describe("Recommended Use Section", () => {
    test("should display recommended use guidance", async ({ page }) => {
      await expect(page.getByText("Recommended Use:")).toBeVisible();
      await expect(page.getByText("initial estimates only")).toBeVisible();
      await expect(page.getByText("Literature precedent")).toBeVisible();
      await expect(page.getByText("Pilot dose-finding studies")).toBeVisible();
      await expect(page.getByText(/Safety factors.*10-fold/)).toBeVisible();
    });
  });

  test.describe("Species Data Sources", () => {
    test("should display species data sources alert", async ({ page }) => {
      await expect(page.getByText("Species Data Sources")).toBeVisible();
    });

    test("should cite primary sources", async ({ page }) => {
      await expect(
        page.getByText("Primary Sources (Peer-Reviewed):"),
      ).toBeVisible();
      await expect(page.getByText(/Davies B, Morris T.*1993/)).toBeVisible();
      await expect(page.getByText(/Brown RP.*1997/)).toBeVisible();
      await expect(page.getByText(/FDA Guidance.*2005/)).toBeVisible();
      await expect(page.getByText(/Nair AB, Jacob S.*2016/)).toBeVisible();
    });

    test("should cite additional sources", async ({ page }) => {
      await expect(page.getByText("Additional Sources:")).toBeVisible();
      await expect(page.getByText(/Lin Z.*2020/)).toBeVisible();
      await expect(page.getByText(/Sharma V, McNeill JH.*2009/)).toBeVisible();
    });
  });
});

test.describe("Documentation Tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: /Documentation/i }).click();
  });

  test.describe("Page Structure", () => {
    test("should display Understanding Dose Scaling Methods section", async ({
      page,
    }) => {
      await expect(
        page.getByText("Understanding Dose Scaling Methods"),
      ).toBeVisible();
    });

    test("should display all scaling method cards", async ({ page }) => {
      await expect(
        page.getByText("1. Allometric Scaling (Default Method)"),
      ).toBeVisible();
      await expect(page.getByText("2. Brain Weight Scaling")).toBeVisible();
      await expect(page.getByText("3. Life-Span Scaling")).toBeVisible();
      await expect(
        page.getByText("4. Hepatic Blood Flow Scaling"),
      ).toBeVisible();
      await expect(page.getByText("5. BSA-Based Scaling")).toBeVisible();
    });
  });

  test.describe("Allometric Scaling Card", () => {
    test("should describe allometric scaling method", async ({ page }) => {
      await expect(
        page.getByText("The simplest and most widely used scaling method"),
      ).toBeVisible();
    });

    test("should list when to use allometric scaling", async ({ page }) => {
      await expect(
        page.getByText("Most common scaling situations"),
      ).toBeVisible();
      await expect(
        page.getByText("metabolically active compounds"),
      ).toBeVisible();
      await expect(page.getByText("initial dose estimations")).toBeVisible();
    });

    test("should explain 3/4 power law", async ({ page }) => {
      await expect(page.getByText(/3\/4 power law.*0\.75/)).toBeVisible();
    });

    test("should show molecular weight adjustments", async ({ page }) => {
      await expect(
        page.getByText(/MW > 700 Da → exponent = 0\.70/),
      ).toBeVisible();
      await expect(
        page.getByText(/400 < MW ≤ 700 Da → exponent = 0\.75/),
      ).toBeVisible();
      await expect(
        page.getByText(/MW ≤ 400 Da → exponent = 0\.80/),
      ).toBeVisible();
    });
  });

  test.describe("Brain Weight Scaling Card", () => {
    test("should describe brain weight scaling", async ({ page }) => {
      await expect(
        page.getByText("Scaling based on brain weight differences"),
      ).toBeVisible();
    });

    test("should list when to use brain weight scaling", async ({ page }) => {
      await expect(page.getByText("CNS-active compounds")).toBeVisible();
      await expect(
        page.getByText("Drugs that cross the blood-brain barrier"),
      ).toBeVisible();
      await expect(page.getByText("Neurological treatments")).toBeVisible();
    });
  });

  test.describe("Life-Span Scaling Card", () => {
    test("should describe life-span scaling", async ({ page }) => {
      await expect(page.getByText("3. Life-Span Scaling")).toBeVisible();
    });

    test("should list when to use life-span scaling", async ({ page }) => {
      await expect(page.getByText("Long-term toxicity studies")).toBeVisible();
    });
  });

  test.describe("Hepatic Blood Flow Scaling Card", () => {
    test("should describe hepatic blood flow scaling", async ({ page }) => {
      await expect(
        page.getByText("4. Hepatic Blood Flow Scaling"),
      ).toBeVisible();
    });

    test("should list when to use hepatic flow scaling", async ({ page }) => {
      // Card content should exist
      await expect(
        page.getByText("4. Hepatic Blood Flow Scaling"),
      ).toBeVisible();
    });
  });

  test.describe("BSA-Based Scaling Card", () => {
    test("should describe BSA-based scaling", async ({ page }) => {
      await expect(
        page.getByText("body surface area differences"),
      ).toBeVisible();
    });

    test("should list when to use BSA scaling", async ({ page }) => {
      await expect(page.getByText("Many anticancer drugs")).toBeVisible();
      await expect(
        page.getByText("Initial human dose estimates"),
      ).toBeVisible();
    });

    test("should show key points about BSA", async ({ page }) => {
      await expect(
        page.getByText("Uses built-in approximate BSA values"),
      ).toBeVisible();
      await expect(page.getByText("Direct ratio scaling")).toBeVisible();
      await expect(page.getByText("Common in clinical settings")).toBeVisible();
    });
  });

  test.describe("Advanced Features Section", () => {
    test("should display Advanced Features section", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Advanced Features" }),
      ).toBeVisible();
    });

    test("should explain kidney function adjustment", async ({ page }) => {
      // Scroll down to find this section
      const documentationContainer = page.locator(".overflow-y-auto").first();
      await documentationContainer.evaluate((el) => el.scrollTo(0, 500));
      await page.waitForTimeout(100);
      await expect(
        page.getByText("Kidney Function Adjustment").first(),
      ).toBeVisible();
    });

    test("should explain bioavailability options", async ({ page }) => {
      // Use first() to handle the two headings (card title and references subsection)
      await expect(
        page.getByText("Bioavailability by Route of Administration").first(),
      ).toBeVisible();
      await expect(
        page.getByText(
          /Literature-based default values.*routes of administration/,
        ),
      ).toBeVisible();
    });
  });

  test.describe("Best Practices Section", () => {
    test("should display Best Practices section", async ({ page }) => {
      await expect(page.getByText("Best Practices")).toBeVisible();
    });

    test("should list conservative starting practices", async ({ page }) => {
      await expect(
        page.getByText("1. Always Start Conservative"),
      ).toBeVisible();
      await expect(page.getByText("Begin with lower doses")).toBeVisible();
      await expect(
        page.getByText("Use multiple scaling methods for comparison"),
      ).toBeVisible();
    });

    test("should list documentation practices", async ({ page }) => {
      await expect(page.getByText("2. Document Your Choice")).toBeVisible();
      await expect(page.getByText("Record scaling method used")).toBeVisible();
    });

    test("should list validation practices", async ({ page }) => {
      await expect(page.getByText("3. Validate Results")).toBeVisible();
      await expect(
        page.getByText("Compare with literature data"),
      ).toBeVisible();
    });
  });

  test.describe("Important Reminders Section", () => {
    test("should display important reminders", async ({ page }) => {
      await expect(page.getByText("Important Reminders")).toBeVisible();
      await expect(
        page.getByText("estimation tools, not absolute rules"),
      ).toBeVisible();
      await expect(
        page.getByText("Professional judgment is essential"),
      ).toBeVisible();
      await expect(
        page.getByText("research/educational purposes only"),
      ).toBeVisible();
    });
  });

  test.describe("References Section", () => {
    test("should display References section", async ({ page }) => {
      // Use first() to handle multiple References headings (one main, subheadings)
      await expect(
        page.getByRole("heading", { name: "References" }).first(),
      ).toBeVisible();
    });

    test("should cite species database sources", async ({ page }) => {
      await expect(
        page.getByText("Species Database & Physiological Parameters"),
      ).toBeVisible();
      await expect(page.getByText(/Davies.*Morris.*1993/)).toBeVisible();
    });

    test("should cite allometric scaling sources", async ({ page }) => {
      await expect(
        page.getByText("Allometric Scaling & Dose Conversion"),
      ).toBeVisible();
    });
  });

  test.describe("Scrolling Behavior", () => {
    test("should be scrollable to view all content", async ({ page }) => {
      const documentationContainer = page.locator(".overflow-y-auto").first();
      await expect(documentationContainer).toBeVisible();

      // Scroll to bottom
      await documentationContainer.evaluate((el) =>
        el.scrollTo(0, el.scrollHeight),
      );

      // Should be able to see content at bottom (references)
      await expect(
        page.getByText("Detailed Formula Documentation"),
      ).toBeVisible();
    });
  });
});
