import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { secret, tag = "portfolio" } = await request.json();

    if (!process.env.REVALIDATION_SECRET || secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    // Standard Next.js on-demand revalidation
    // Clears the cache for the specified tag (e.g., 'contentful' or 'portfolio')
    revalidateTag(tag, "page");

    // NEW: If we are updating Contentful content, also trigger the AI to re-seed its memory
    if (tag === "contentful") {
      const workerUrl = process.env.NEXT_PUBLIC_CHATBOT_URL || "https://ai-chatbot-widget.sehgaldival.workers.dev";
      const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://divalsehgal.vercel.app";
      
      // Fire and forget (don't wait for AI to finish to keep the webhook fast)
      fetch(`${workerUrl}/api/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextUrl: `${siteUrl}/api/chat-context` })
      }).catch((err) =>
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
