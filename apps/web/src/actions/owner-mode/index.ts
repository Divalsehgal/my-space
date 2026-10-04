"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  OWNER_COOKIE_MAX_AGE,
  OWNER_FLAG_COOKIE,
  OWNER_SESSION_COOKIE,
  isOwnerSecret,
  ownerSessionToken,
} from "@/lib/owner";

const FAILED_ATTEMPT_DELAY_MS = 800;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Signs the owner in: verifies the secret server-side and sets the session cookies. */
export async function enableOwnerMode(formData: FormData): Promise<void> {
  const secretField = formData.get("secret");
  const candidate = typeof secretField === "string" ? secretField : "";
  const token = ownerSessionToken();
  if (!token || !isOwnerSecret(candidate)) {
    // Slow down guessing; the response never says which part was wrong.
    await sleep(FAILED_ATTEMPT_DELAY_MS);
    redirect("/owner?error=1");
  }

  const store = await cookies();
  const base = { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: OWNER_COOKIE_MAX_AGE } as const;
  store.set(OWNER_SESSION_COOKIE, token, { ...base, httpOnly: true });
  store.set(OWNER_FLAG_COOKIE, "1", { ...base, httpOnly: false });
  redirect("/owner");
}

/** Signs the owner out. */
export async function disableOwnerMode(): Promise<void> {
  const store = await cookies();
  store.delete(OWNER_SESSION_COOKIE);
  store.delete(OWNER_FLAG_COOKIE);
  redirect("/owner");
}
