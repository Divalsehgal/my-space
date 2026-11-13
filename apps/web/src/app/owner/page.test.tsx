import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import OwnerPage, { generateMetadata } from "./page";
import { isOwnerModeConfigured, isOwnerSession } from "@/lib/owner";

jest.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "s" }) }) }));
jest.mock("@/actions/owner-mode", () => ({ enableOwnerMode: jest.fn(), disableOwnerMode: jest.fn() }));
jest.mock("@/lib/owner", () => ({ OWNER_SESSION_COOKIE: "owner_session", isOwnerModeConfigured: jest.fn(), isOwnerSession: jest.fn() }));

const page = async (error?: string) => render(await OwnerPage({ searchParams: Promise.resolve({ error }) }));

describe("OwnerPage", () => {
  beforeEach(() => {
    (isOwnerModeConfigured as jest.Mock).mockReturnValue(true);
    (isOwnerSession as jest.Mock).mockReturnValue(false);
  });

  it("is never indexed", () => {
    expect(generateMetadata().robots).toEqual({ index: false, follow: false });
  });

  it("explains when owner mode is not configured", async () => {
    (isOwnerModeConfigured as jest.Mock).mockReturnValue(false);
    await page();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(document.querySelector("form")).toBeNull();
  });

  it("shows the sign-in form, with an error", async () => {
    const { container } = await page("bad");
    expect(container.querySelector('input[type="password"]')).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the sign-in form without an error", async () => {
    const { container } = await page();
    expect(container.querySelector('input[type="password"]')).not.toHaveAttribute("aria-invalid", "true");
  });

  it("shows sign-out when signed in", async () => {
    (isOwnerSession as jest.Mock).mockReturnValue(true);
    const { container } = await page();
    expect(container.querySelector("input")).toBeNull();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
