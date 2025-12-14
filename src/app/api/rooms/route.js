import { db } from '@/lib/db';
import { customAlphabet } from 'nanoid';
import { NextResponse } from 'next/server';

// Alpha-numeric only for safe URLs
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

export async function POST(req) {
    try {
        const slug = nanoid();
        // Create room in DB (just marking it exists)
        await db.hset(`room:${slug}`, { created: Date.now() });

        return NextResponse.json({ slug });
    } catch (error) {
        console.error('Room Creation Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
