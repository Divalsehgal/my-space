import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("renders the hero and core sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const id of ["about", "skills", "experience", "projects", "contact"]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test("has no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test("keeps a saved dark theme across reloads (no hydration reset)", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("theme-mode", "dark"));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(errors.filter((message) => message.includes("418"))).toEqual([]);
  });

  test("the theme toggle switches and remembers the theme", async ({ page, isMobile }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /Switch to (dark|light) mode/ }).first();
    if (!isMobile) {await expect(toggle).toBeVisible();}
    const before = await page.locator("html").getAttribute("data-theme");
    await toggle.click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", before ?? "light");
    await page.reload();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", before ?? "light");
  });
});

test.describe("navigation", () => {
  test("desktop nav links scroll to their section", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop links are collapsed into the menu on mobile");
    await page.goto("/");
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Skills" }).click();
    await expect(page.locator("#skills")).toBeInViewport({ ratio: 0.2 });
  });

  test("mobile menu opens and closes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("button", { name: "Close menu" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  });
});

test.describe("carousels", () => {
  test("show exactly one slide at a time (inactive slides stay mounted but hidden)", async ({ page }) => {
    await page.goto("/");
    for (const section of ["#experience", "#projects"]) {
      const slides = page.locator(`${section} [class*="carousel__item-wrapper"]`);
      await expect(slides.first()).toBeAttached();
      expect(await slides.count()).toBeGreaterThan(1);
      const visible = await slides.evaluateAll((els) => els.filter((el) => getComputedStyle(el).display !== "none").length);
      expect(visible).toBe(1);
    }
  });
});
