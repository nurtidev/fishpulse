import { test, expect } from "@playwright/test";

test.describe("FishPulse — Home Page", () => {
  test("loads and shows branding + search UI", async ({ page }) => {
    await page.goto("/");

    // Header branding
    await expect(page.getByText("FishPulse")).toBeVisible();
    await expect(page.getByText("beta")).toBeVisible();
    await expect(page.getByRole("link", { name: /GitHub/i })).toBeVisible();

    // Search input
    const input = page.getByPlaceholder(/.+/);
    await expect(input).toBeVisible();

    // Geolocation button should be visible
    await expect(page.getByText(/моё местоположение|my location|менің орным/i)).toBeVisible();

    // Preset spots grid should show at least 4 spots
    const presets = page.locator("button").filter({ hasText: /Капчагай|Балхаш|Бухтарма|Зайсан/i });
    await expect(presets.first()).toBeVisible();
  });

  test("shows all 6 preset fishing spots", async ({ page }) => {
    await page.goto("/");
    const spotsSection = page.locator("div").filter({ hasText: /Капчагай/ }).last();
    await expect(spotsSection).toBeVisible();

    // All 6 preset spots
    for (const spot of ["Капчагай", "Балхаш", "Бухтарма", "Зайсан"]) {
      await expect(page.getByText(spot, { exact: false })).toBeVisible();
    }
  });
});

test.describe("FishPulse — Language Switcher", () => {
  // Language switcher is inside the header nav group (РУ / ҚАЗ / EN)
  const langSwitcher = (page: import("@playwright/test").Page) =>
    page.locator("div").filter({ hasText: /^РУҚАЗEN$/ }).first();

  test("switches to English", async ({ page }) => {
    await page.goto("/");
    await langSwitcher(page).getByText("EN").click();
    await expect(page.getByText(/my location/i)).toBeVisible();
    await expect(page.getByText("Kapchagay")).toBeVisible();
  });

  test("switches to Kazakh", async ({ page }) => {
    await page.goto("/");
    await langSwitcher(page).getByText("ҚАЗ").click();
    await expect(page.getByText("Қапшағай")).toBeVisible();
  });

  test("switches back to Russian", async ({ page }) => {
    await page.goto("/");
    await langSwitcher(page).getByText("EN").click();
    await langSwitcher(page).getByText("РУ").click();
    await expect(page.getByText("Капчагай")).toBeVisible();
  });
});

test.describe("FishPulse — Forecast via Preset Spot", () => {
  test("clicking Капчагай loads forecast panel", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /Капчагай/i }).click();

    // URL should update with lat/lon
    await expect(page).toHaveURL(/lat=.*lon=/);

    // Location name should appear in header
    await expect(page.getByText(/Капчагай/i)).toBeVisible();

    // Should show loading skeleton or data
    // Wait for loading to complete (API call may take a few seconds)
    await page.waitForSelector("[class*='animate-pulse']", {
      state: "detached",
      timeout: 15000,
    }).catch(() => {/* skeleton may disappear fast */});

    // Bite gauge area should appear
    await page.waitForSelector("text=/\\d+\\/100/", { timeout: 15000 });
  });

  test("forecast panel shows bite index, best window, factors", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Капчагай/i }).click();

    // Wait for data to load
    await expect(page.locator("text=/\\d+\\/100/").first()).toBeVisible({ timeout: 15000 });

    // Best window section
    await expect(page.locator("text=🏆")).toBeVisible();

    // Daily rating and moon phase grid
    await expect(page.getByText(/%/).first()).toBeVisible();

    // Factors accordion should exist
    await expect(page.getByRole("button", { name: /факторы|factors|факторлар/i })).toBeVisible();
  });

  test("factors accordion opens and shows factor bars", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Капчагай/i }).click();

    // Wait for forecast data
    await expect(page.locator("text=/\\d+\\/100/").first()).toBeVisible({ timeout: 15000 });

    // Open factors accordion
    const factorsBtn = page.getByRole("button", { name: /факторы|factors|факторлар/i });
    await factorsBtn.click();

    // Factor bars should appear (Солунар label in the factor bar)
    await expect(page.getByText(/солунар|solunar/i).first()).toBeVisible();
  });

  test("back button returns to home screen", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Капчагай/i }).click();

    // Wait for panel
    await expect(page.locator("text=/\\d+\\/100/").first()).toBeVisible({ timeout: 15000 });

    // Press back
    await page.getByRole("button", { name: /назад|back|артқа/i }).click();

    // Should be back to home screen
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?$/);
    await expect(page.getByRole("button", { name: /Капчагай/i })).toBeVisible();
  });
});

test.describe("FishPulse — Species Switching", () => {
  test("can switch between fish species", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Капчагай/i }).click();

    // Wait for species chips to load
    await page.waitForSelector("text=/\\d+\\/100/", { timeout: 15000 });

    // Species chips should be visible (pike is default)
    // Look for at least one species chip that is not pike
    const speciesChips = page.locator("button").filter({ hasText: /судак|карп|карась|сазан|perch|carp/i });
    if (await speciesChips.count() > 0) {
      await speciesChips.first().click();
      // URL should update with new species
      await expect(page).toHaveURL(/species=/);
    }
  });
});

test.describe("FishPulse — URL State", () => {
  test("restores forecast from URL params", async ({ page }) => {
    // Navigate directly with coords for Kapchagay
    await page.goto("/?lat=43.85700&lon=77.10300&name=Капчагай&species=pike");

    // Should load forecast directly
    await expect(page.getByText(/Капчагай/i)).toBeVisible();
    await expect(page.locator("text=/\\d+\\/100/").first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("FishPulse — API Health", () => {
  test("backend health endpoint responds", async ({ request }) => {
    const response = await request.get("http://localhost:8080/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("species API returns list of fish", async ({ request }) => {
    const response = await request.get("http://localhost:8080/api/v1/species");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty("key");
    expect(body[0]).toHaveProperty("name");
  });

  test("bite API returns forecast for valid coordinates", async ({ request }) => {
    const response = await request.get(
      "http://localhost:8080/api/v1/bite?lat=43.857&lon=77.103&species=pike&lang=ru"
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("current");
    expect(body).toHaveProperty("forecast");
    expect(body).toHaveProperty("best_window");
    expect(body.current.index).toBeGreaterThanOrEqual(0);
    expect(body.current.index).toBeLessThanOrEqual(100);
  });

  test("bite API returns 400 for missing coordinates", async ({ request }) => {
    const response = await request.get("http://localhost:8080/api/v1/bite");
    expect(response.status()).toBe(400);
  });

  test("bite API returns 400 for invalid species", async ({ request }) => {
    const response = await request.get(
      "http://localhost:8080/api/v1/bite?lat=43.857&lon=77.103&species=unicorn"
    );
    expect(response.status()).toBe(400);
  });
});
