import { NextResponse } from 'next/server';
import { portfolioService } from '@/features/portfolio';
import { getContentfulPostsForContext } from '@/lib/services/contentful-context';

// Set to 1 hour to cache context for faster AI responses (Fallback)
// Updates automatically via 'contentful' tag when posts are published

export async function GET() {
    try {
        const [{ config }, posts] = await Promise.all([
            portfolioService.getConfig(),
            getContentfulPostsForContext(10)
        ]);
        
        return NextResponse.json({
            portfolio: config,
            blogs: posts
        });
    } catch (error) {
        console.error('Chat context API error:', error);
        return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
    }
}
