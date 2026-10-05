import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { disableOwnerMode, enableOwnerMode } from "./index";
import { OWNER_FLAG_COOKIE, OWNER_SESSION_COOKIE, ownerSessionToken } from "@/lib/owner";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
// Like Next's redirect(), throw so code after it never runs.
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const store = { set: jest.fn(), delete: jest.fn() };

function form(secret?: string | Blob) {
  const data = new FormData();
  if (secret !== undefined) {data.append("secret", secret);}
  return data;
}

describe("owner mode actions", () => {
  const original = process.env.ADMIN_VIEW_SECRET;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (cookies as jest.Mock).mockResolvedValue(store);
    process.env.ADMIN_VIEW_SECRET = "s3cret";
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env.ADMIN_VIEW_SECRET = original;
  });

  /** Runs the action, letting the failed-attempt delay elapse. */
  async function attempt(data: FormData) {
    const result = enableOwnerMode(data).catch((error: Error) => error.message);
    await jest.runAllTimersAsync();
    return result;
  }

  it("sets the session and flag cookies for the right secret", async () => {
    await expect(attempt(form("s3cret"))).resolves.toBe("REDIRECT:/owner");
    const options = { path: "/", sameSite: "lax", secure: false, maxAge: expect.any(Number) };
    expect(store.set).toHaveBeenCalledWith(OWNER_SESSION_COOKIE, ownerSessionToken(), { ...options, httpOnly: true });
    expect(store.set).toHaveBeenCalledWith(OWNER_FLAG_COOKIE, "1", { ...options, httpOnly: false });
  });

  it.each([
    ["a wrong secret", form("nope")],
    ["a missing secret", form()],
    ["a file instead of text", form(new Blob(["s3cret"]))],
  ])("rejects %s after a delay", async (_name, data) => {
    await expect(attempt(data)).resolves.toBe("REDIRECT:/owner?error=1");
    expect(store.set).not.toHaveBeenCalled();
  });

  it("rejects everything when owner mode is not configured", async () => {
    delete process.env.ADMIN_VIEW_SECRET;
    await expect(attempt(form(""))).resolves.toBe("REDIRECT:/owner?error=1");
  });

  it("clears both cookies on sign-out", async () => {
    await expect(disableOwnerMode()).rejects.toThrow("REDIRECT:/owner");
    expect(store.delete).toHaveBeenCalledWith(OWNER_SESSION_COOKIE);
    expect(store.delete).toHaveBeenCalledWith(OWNER_FLAG_COOKIE);
    expect(redirect).toHaveBeenCalledWith("/owner");
  });
});
