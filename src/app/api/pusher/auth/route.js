import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';

export async function POST(req) {
    const data = await req.formData();
    const socketId = data.get('socket_id');
    const channel = data.get('channel_name');

    // For presence channel, we need user info.
    // In a real app, verify session here.
    const deviceId = req.headers.get('x-device-id') || `anon-${Date.now()}`;

    const presenceData = {
        user_id: deviceId,
        user_info: {
            deviceId: deviceId,
        },
    };

    try {
        const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData);
        return NextResponse.json(authResponse);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
    }
}
