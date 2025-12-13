import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const socketId = formData.get('socket_id');
        const channelName = formData.get('channel_name');

        // Simple verification (no user auth for now, just allow)
        const presenceData = {
            user_id: Date.now().toString(), // Anonymous unique ID
            user_info: {
                isValid: true,
            },
        };

        const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
        return NextResponse.json(authResponse);
    } catch (error) {
        console.error('Pusher Auth Error:', error);
        return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
    }
}
