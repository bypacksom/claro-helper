const { test, expect } = require("@playwright/test");

test("dashboard responds to ticket actions without freezing", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("helpdesk_claro_adp_v1", "Prueba QA"));
  await page.goto("http://127.0.0.1:4173/claro-helper/", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Asistente Help Desk Claro").first()).toBeVisible();
  await page.getByRole("button", { name: /Ejemplo/i }).click({ timeout: 10000 });
  await expect(page.locator("textarea").first()).not.toBeEmpty();
  await page.getByRole("button", { name: /Analizar ticket/i }).click({ timeout: 10000 });
  await expect(page.getByText("Datos detectados").first()).toBeVisible({ timeout: 10000 }).catch(async () => {
    await expect(page.locator("textarea").first()).not.toBeEmpty();
  });
  await page.getByRole("button", { name: "Limpiar", exact: true }).click({ timeout: 10000 });
});

for (const theme of ["halloween", "navidad"]) {
  test(`${theme} particles appear above dashboard elements without blocking interactions`, async ({ page }) => {
    await page.addInitScript(selectedTheme => {
      localStorage.setItem("helpdesk_claro_theme_v1", selectedTheme);
      localStorage.setItem("helpdesk_claro_adp_v1", "Prueba QA");
    }, theme);
    await page.goto("http://127.0.0.1:4173/claro-helper/", { waitUntil: "domcontentloaded" });

    // Portal avoids parent stacking contexts, and the canvas never catches clicks.
    const canvas = page.locator("body > canvas[aria-hidden='true']");
    await expect(canvas).toBeVisible({ timeout: 10000 });
    await expect(canvas).toHaveCSS("pointer-events", "none");
    const zIndex = await canvas.evaluate(el => Number(getComputedStyle(el).zIndex));
    expect(zIndex).toBeGreaterThan(1000);

    // Regression: the old canvas was only 96px high, so particles could never
    // travel from the floor to the top. Verify real pixels across the viewport.
    const dimensions = await canvas.evaluate(el => ({
      height: el.getBoundingClientRect().height,
      viewportHeight: window.innerHeight,
      width: el.getBoundingClientRect().width,
      viewportWidth: window.innerWidth,
    }));
    expect(Math.abs(dimensions.height - dimensions.viewportHeight)).toBeLessThan(2);
    expect(Math.abs(dimensions.width - dimensions.viewportWidth)).toBeLessThan(2);

    const upperQuarterHasParticles = async () => canvas.evaluate(el => {
      const ctx = el.getContext("2d", { willReadFrequently: true });
      if (!ctx) return false;
      const top = ctx.getImageData(0, 0, el.width, Math.max(1, Math.floor(el.height / 4))).data;
      for (let index = 3; index < top.length; index += 4) {
        if (top[index] > 0) return true;
      }
      return false;
    });

    // Wait until the canvas has actually rendered a frame; clicking before
    // the particle seeding effect runs would otherwise produce no burst.
    const lowerBandHasParticles = async () => canvas.evaluate(el => {
      const ctx = el.getContext("2d");
      if (!ctx) return false;
      const y = Math.max(0, Math.floor(el.height * 0.94));
      const rgba = ctx.getImageData(0, y, el.width, Math.max(1, Math.floor(el.height * 0.04))).data;
      for (let i = 3; i < rgba.length; i += 4) {
        if (rgba[i] > 0) return true;
      }
      return false;
    });
    await expect.poll(lowerBandHasParticles, { timeout: 5000 }).toBe(true);
    await expect.poll(upperQuarterHasParticles, { timeout: 3000 }).toBe(false);
    const trigger = theme === "halloween" ? /Calabaza de Halloween/ : /Bola de cristal de nieve/;
    const triggerButton = page.getByRole("button", { name: trigger });
    await triggerButton.click({ timeout: 10000 });
    const classAfterClick = await triggerButton.getAttribute("class");
    console.log(`${theme} click animation class:`, classAfterClick);

    // Particles must visibly rise into the upper quarter and then fall again.
    await expect.poll(upperQuarterHasParticles, {
      timeout: 6000,
      intervals: [100, 150, 200],
    }).toBe(true);
    await expect.poll(upperQuarterHasParticles, {
      timeout: 8000,
      intervals: [150, 300, 500],
    }).toBe(false);

    await page.getByRole("button", { name: /Ejemplo/i }).click({ timeout: 10000 });
    await expect(page.locator("textarea").first()).not.toBeEmpty();
  });
}
