import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
    try {
        const { slug } = await params;
        const body = await req.json();
        const { deviceId, emoji } = body;

        // Must match the channel client subscribes to (presence-room-...)
        const channelName = `presence-room-${slug}`;

        await pusherServer.trigger(channelName, 'message:new', {
            id: Date.now().toString(),
            emoji,
            senderDeviceId: deviceId, // Use this to ignore own messages
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Message Send Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
