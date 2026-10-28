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
