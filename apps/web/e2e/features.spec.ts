import { expect, test } from "@playwright/test";

test.describe("contact form", () => {
  test("labels every field and blocks empty submission", async ({ page }) => {
    await page.goto("/#contact");
    const name = page.getByLabel(/^Name/);
    await expect(name).toBeVisible();
    await expect(page.getByLabel(/^Email/)).toBeVisible();
    await expect(page.getByLabel(/^Message/)).toBeVisible();

    await page.getByRole("button", { name: "Send message" }).click();
    const invalid = await page.evaluate(() => !(document.getElementById("contact-form") as HTMLFormElement).checkValidity());
    expect(invalid).toBe(true);
  });

  test("message templates fill the message field", async ({ page }) => {
    await page.goto("/#contact");
    await page.getByRole("button", { name: "Just saying hi" }).click();
    await expect(page.getByLabel(/^Message/)).not.toHaveValue("");
  });
});

test.describe("stack game", () => {
  test("opens only from the Play button and closes with Escape", async ({ page, isMobile }) => {
    test.skip(isMobile, "the Play button is hidden on phones; the game opens from the command palette");
    await page.goto("/");
    await page.waitForTimeout(13_000); // longer than the old idle prompt
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Play the stack game" }).click();
    const dialog = page.getByRole("dialog", { name: "Build the stack" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
});

test.describe("blog", () => {
  test("lists posts and filters them by search", async ({ page }) => {
    await page.goto("/blogs");
    await expect(page.getByRole("heading", { name: "Tech blogs" })).toBeVisible();
    const search = page.getByPlaceholder("Search posts…");
    await search.fill("zzzz-no-such-post");
    await expect(page.getByText("No posts found matching your search.")).toBeVisible();
  });
});

test("unknown routes show the 404 page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to homepage" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: "Read the blog" })).toHaveAttribute("href", "/blogs");
});
