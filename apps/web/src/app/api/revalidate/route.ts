import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { secret, tag = "portfolio" } = await request.json();

    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    // Standard Next.js on-demand revalidation
    // Clears the cache for the specified tag (e.g., 'contentful' or 'portfolio')
    revalidateTag(tag, "page");

    // NEW: If we are updating Contentful content, also trigger the AI to re-seed its memory
    if (tag === "contentful") {
      const workerUrl = process.env.NEXT_PUBLIC_CHATBOT_URL || "https://ai-chatbot-widget.sehgaldival.workers.dev";
      
      // Fire and forget (don't wait for AI to finish to keep the webhook fast)
      fetch(`${workerUrl}/api/seed`, { method: "POST" }).catch((err) => 
        console.error("Automated AI Seeding failed:", err)
      );
    }
    
    return NextResponse.json({ 
      revalidated: true, 
      tag,
      aiSeeded: tag === "contentful",
      now: Date.now() 
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json({ message: "Error revalidating" }, { status: 500 });
  }
}
