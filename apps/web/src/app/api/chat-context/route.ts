import { NextResponse } from 'next/server';
import { portfolioService } from '@/features/portfolio';
import { getContentfulPostsForContext } from '@/lib/services/contentful-context';

export async function GET() {
    try {
        const [{ config }, posts] = await Promise.all([
            portfolioService.getConfig(),
            getContentfulPostsForContext(10)
        ]);
        
        return NextResponse.json({
            portfolio: config,
            blogPosts: posts
        });
    } catch (error) {
        console.error('Chat context API error:', error);
        return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
    }
}
