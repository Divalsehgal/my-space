import { NextResponse } from 'next/server';
import { portfolioService } from '@/features/portfolio';
import { getNotionPosts } from '@/lib/services/notion';

export async function GET() {
    try {
        const { config } = await portfolioService.getConfig();
        const posts = await getNotionPosts();
        
        return NextResponse.json({
            portfolio: config,
            blogs: posts.map(p => ({
                title: p.title,
                description: p.description,
                tags: p.tags,
                date: p.date
            }))
        });
    } catch (error) {
        console.error('Chat context API error:', error);
        return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
    }
}
