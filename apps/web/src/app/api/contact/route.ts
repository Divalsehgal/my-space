import { NextResponse } from 'next/server';
import { createContactSubmission } from '@/lib/services/notion';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, message } = body;
        
        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields (name, email, message)' }, { status: 400 });
        }
        
        await createContactSubmission({ name, email, message });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contact API error:', error);
        return NextResponse.json({ error: 'Failed to submit contact request to Notion' }, { status: 500 });
    }
}
