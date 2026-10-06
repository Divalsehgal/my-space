import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/** Leaves preview: clears the draft-mode cookie and returns to the published post. */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  (await draftMode()).disable();
  redirect(slug ? `/blogs/${encodeURIComponent(slug)}` : "/blogs");
}
