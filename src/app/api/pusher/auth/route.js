import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        let socketId, channelName;
        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            socketId = formData.get('socket_id');
            channelName = formData.get('channel_name');
        } else {
            const body = await req.json();
            socketId = body.socket_id;
            channelName = body.channel_name;
        }

        if (!socketId || !channelName) {
            throw new Error(`Missing params: socket_id=${socketId}, channel_name=${channelName}`);
        }

        const presenceData = {
            user_id: Math.random().toString(36).slice(2),
            user_info: { isValid: true },
        };

        const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
        return NextResponse.json(authResponse);
    } catch (error) {
        console.error('Pusher Auth Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
