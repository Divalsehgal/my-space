import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getContentfulPostItemBySlug } from "@/lib/services/contentful";
import { blogPreviewPath, isValidPreviewSecret } from "@/lib/preview";

/**
 * Contentful preview URL target:
 *   /api/preview?secret=<CONTENTFUL_PREVIEW_SECRET>&slug={entry.fields.slug}
 * Turns on draft mode (an httpOnly cookie) and sends the editor to the
 * draft-aware preview page.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!isValidPreviewSecret(searchParams.get("secret"))) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
  if (!slug) {
    return NextResponse.json({ message: "Missing slug" }, { status: 400 });
  }

  // Only redirect to posts that exist, so the endpoint can't be used as an open redirect.
  const item = await getContentfulPostItemBySlug(slug, true);
  if (!item) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }

  (await draftMode()).enable();
  redirect(blogPreviewPath(item.slug));
}
