import { test, expect } from "@playwright/test";

// Utility: проверяет горизонтальный overflow на текущей странице
async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  expect(hasOverflow, "Горизонтальный скролл не должен появляться").toBe(false);
}

test.describe("Mobile — Главная страница", () => {
  test("нет горизонтального скролла на главной", async ({ page }) => {
    await page.goto("/");
    await expectNoHorizontalOverflow(page);
  });

  test("шапка и логотип читаемы на мобильном", async ({ page }) => {
    await page.goto("/");

    // Логотип виден
    await expect(page.getByText("FishPulse")).toBeVisible();
    await expect(page.getByText("beta")).toBeVisible();

    // Логотип не обрезан — bounding box ненулевой и в пределах вьюпорта
    const logo = page.getByText("FishPulse");
    const box = await logo.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  });

  test("кнопка геолокации видна и не выходит за края", async ({ page }) => {
    await page.goto("/");
    const geoBtn = page.getByText(/моё местоположение|my location|менің орным/i);
    await expect(geoBtn).toBeVisible();

    const box = await geoBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  });

  test("пресеты мест отображаются в сетке без обрезания", async ({ page }) => {
    await page.goto("/");

    for (const spot of ["Капчагай", "Балхаш", "Бухтарма", "Зайсан"]) {
      const btn = page.getByRole("button", { name: new RegExp(spot, "i") }).first();
      await expect(btn).toBeVisible();

      const box = await btn.boundingBox();
      expect(box).not.toBeNull();
      // кнопка не за правым краем
      expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 2);
    }
  });

  test("поле поиска занимает разумную ширину", async ({ page }) => {
    await page.goto("/");
    const input = page.getByPlaceholder(/.+/);
    await expect(input).toBeVisible();

    const box = await input.boundingBox();
    const vw = page.viewportSize()!.width;
    expect(box).not.toBeNull();
    // инпут занимает хотя бы 60% ширины экрана
    expect(box!.width).toBeGreaterThan(vw * 0.6);
  });
});

test.describe("Mobile — Переключатель языков", () => {
  test("переключатель языков виден и кликабелен", async ({ page }) => {
    await page.goto("/");
    const switcher = page.locator("div").filter({ hasText: /^РУҚАЗEN$/ }).first();
    await expect(switcher).toBeVisible();

    // все три кнопки языка доступны на мобильном
    await expect(switcher.getByText("РУ")).toBeVisible();
    await expect(switcher.getByText("ҚАЗ")).toBeVisible();
    await expect(switcher.getByText("EN")).toBeVisible();
  });

  test("переключение языка работает на мобильном", async ({ page }) => {
    await page.goto("/");
    const switcher = page.locator("div").filter({ hasText: /^РУҚАЗEN$/ }).first();
    await switcher.getByText("EN").click();
    await expect(page.getByText(/my location/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("Mobile — Панель прогноза", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Капчагай/i }).click();
    // ждём загрузки данных
    await expect(page.locator("text=/\\d+\\/100/").first()).toBeVisible({ timeout: 20000 });
  });

  test("нет горизонтального скролла на панели прогноза", async ({ page }) => {
    await expectNoHorizontalOverflow(page);
  });

  test("индекс клёва виден и не обрезан", async ({ page }) => {
    const score = page.locator("text=/\\d+\\/100/").first();
    await expect(score).toBeVisible();

    const box = await score.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 2);
  });

  test("секция 'лучшее окно' видна на мобильном", async ({ page }) => {
    await expect(page.locator("text=🏆")).toBeVisible();
  });

  test("аккордеон факторов открывается и не ломает вёрстку", async ({ page }) => {
    const factorsBtn = page.getByRole("button", { name: /факторы|factors|факторлар/i });
    await expect(factorsBtn).toBeVisible();
    await factorsBtn.click();

    // контент факторов появился
    await expect(page.getByText(/солунар|solunar/i).first()).toBeVisible();
    // вёрстка не поплыла
    await expectNoHorizontalOverflow(page);
  });

  test("кнопка 'назад' видна и возвращает на главную", async ({ page }) => {
    const backBtn = page.getByRole("button", { name: /назад|back|артқа/i });
    await expect(backBtn).toBeVisible();

    const box = await backBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);

    await backBtn.click();
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?$/);
  });

  test("ряд с чипами рыб скроллится внутри, не ломая страницу", async ({ page }) => {
    // Контейнер чипов использует overflow-x-auto (горизонтальный скролл внутри).
    // Проверяем, что страница не получает горизонтального скролла из-за чипов.
    await expectNoHorizontalOverflow(page);

    // Контейнер чипов не выходит за края вьюпорта
    const vw = page.viewportSize()!.width;
    const chipsRow = page.locator("div.overflow-x-auto").first();
    if (await chipsRow.count() > 0) {
      const box = await chipsRow.boundingBox();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(vw + 2);
      }
    }

    // Внутри контейнера чипы действительно есть (прокрутка имеет смысл)
    const chips = page.locator("button").filter({ hasText: /щука|судак|карп|карась|pike|perch|carp/i });
    expect(await chips.count()).toBeGreaterThan(0);
  });
});

test.describe("Mobile — Скриншоты (визуальный контроль)", () => {
  test("главная страница — скриншот", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveScreenshot("home-mobile.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test("панель прогноза — скриншот", async ({ page }) => {
    await page.goto("/?lat=43.85700&lon=77.10300&name=Капчагай&species=pike");
    await expect(page.locator("text=/\\d+\\/100/").first()).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveScreenshot("forecast-mobile.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });
});
