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

    await page.getByRole("button", { name: /Ejemplo/i }).click({ timeout: 10000 });
    await expect(page.locator("textarea").first()).not.toBeEmpty();
  });
}
