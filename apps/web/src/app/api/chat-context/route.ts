import { NextResponse } from 'next/server';
import { portfolioService } from '@/features/portfolio';
import { getContentfulPostsForContext } from '@/lib/services/contentful-context';
import { getT } from '@/i18n/server';

/** Newest posts indexed by the chatbot (matches the Worker's MAX_SEEDED_ITEMS). */
const CONTEXT_POST_COUNT = 50;

export async function GET() {
    try {
        const [{ config }, posts] = await Promise.all([
            portfolioService.getConfig(),
            getContentfulPostsForContext(CONTEXT_POST_COUNT)
        ]);
        
        // The portfolio JSON holds data only; the intro copy the chatbot needs
        // lives in the Contentful translations.
        const t = getT();
        const profile = {
            name: t('common.siteName'),
            role: config.experience[0]?.role ?? t('hero.deck.defaultRole'),
            summary: t('hero.subtitle'),
            about: t('about.body'),
            contactIntro: t('contact.intro'),
        };

        // Only what the Worker indexes: the architecture diagram and other
        // display-only config would just inflate every seed fetch.
        const { experience, projects, skills, socials, contact, hero } = config;
        return NextResponse.json({
            profile,
            portfolio: { experience, projects, skills, socials, contact, resumeUrl: hero.resumeUrl },
            blogs: posts
        });
    } catch (error) {
        console.error('Chat context API error:', error);
        return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
    }
}
