import { db } from '@/lib/db';
import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

export async function POST(req, { params }) {
    try {
        const { slug } = params;
        const roomId = `room:${slug}`;
        const { deviceId, emoji } = await req.json();

        const messageId = nanoid();
        const now = new Date().toISOString();
        const message = {
            id: messageId,
            roomId,
            senderDeviceId: deviceId,
            emoji,
            createdAt: now
        };

        // Update Room Activity
        await db.hset(roomId, { lastActivityAt: now });

        // Trigger Pusher Event
        // Channel name: presence-{roomId} (using slug as ID part for simplicity if unique)
        // Actually roomId in DB is `room:${slug}`. Let's use `presence-room-${slug}` for channel name to be safe.
        await pusherServer.trigger(`presence-room-${slug}`, 'message:new', message);

        return NextResponse.json({ success: true, messageId });
    } catch (error) {
        console.error("Send Message Error", error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
