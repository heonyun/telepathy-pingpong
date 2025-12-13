import { db } from '@/lib/db';
import { customAlphabet } from 'nanoid';
import { NextResponse } from 'next/server';

// Alpha-numeric only for safe URLs
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

export async function POST(req) {
    try {
        const { deviceId } = await req.json();

        const slug = nanoid();
        const roomId = `room:${slug}`;
        const now = new Date().toISOString();

        const roomData = {
            id: roomId,
            slug,
            ownerDeviceId: deviceId,
            createdAt: now,
            lastActivityAt: now,
            isDeleted: false
        };

        await db.hset(roomId, roomData);

        return NextResponse.json({ roomId, slug, url: `/r/${slug}` });
    } catch (error) {
        console.error("Create Room Error", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
