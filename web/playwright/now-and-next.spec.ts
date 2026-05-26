import { test, expect } from "@playwright/test";

test.describe("Now & Next — клюёт сейчас + ближайшие окна", () => {
  test("блок отображается на панели прогноза с данными", async ({ page }) => {
    await page.goto("/?lat=51.18&lon=71.45&name=Astana&species=pike");

    // Ждём загрузки основной панели (индекс клёва)
    await expect(page.locator("text=/\\d+\\/100/").first()).toBeVisible({ timeout: 20000 });

    // Должен быть заголовок «Клюёт сейчас» либо «Ближайшие окна»
    const nowOrNext = page
      .locator("h3", { hasText: /Клюёт сейчас|Ближайшие окна|Biting now|Next windows/i })
      .first();
    await expect(nowOrNext).toBeVisible({ timeout: 10000 });
  });

  test("карточка вида кликабельна и переключает выбранный вид", async ({ page }) => {
    await page.goto("/?lat=51.18&lon=71.45&name=Astana&species=pike");
    await expect(page.locator("text=/\\d+\\/100/").first()).toBeVisible({ timeout: 20000 });

    // Берём любую кнопку-карточку внутри блока now-and-next (имеет ru-имя рыбы).
    // Кликаем по первой видимой рыбе и убеждаемся, что URL обновился (species изменился).
    const card = page
      .locator("button", { hasText: /Жерех|Окунь|Карась|Карп|Линь|Лещ|Щука|Судак|Сом|Налим|Язь|Плотва/i })
      .first();
    if ((await card.count()) === 0) test.skip(true, "no now/next cards in current conditions");

    await card.click();
    // species в URL поменялся на что-то отличное от pike
    await expect(page).toHaveURL(/species=(?!pike)/);
  });
});
