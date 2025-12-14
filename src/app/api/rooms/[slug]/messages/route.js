import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';
import PushNotifications from '@pusher/push-notifications-server';

const beamsClient = new PushNotifications({
    instanceId: process.env.PUSHER_BEAMS_INSTANCE_ID,
    secretKey: process.env.PUSHER_BEAMS_SECRET_KEY,
});

export async function POST(req, { params }) {
    try {
        const { slug } = await params;
        const body = await req.json();
        const { deviceId, emoji, id } = body;

        // Trigger Pusher (Real-time)
        await pusherServer.trigger(`presence-room-${slug}`, 'message:new', {
            emoji,
            senderDeviceId: deviceId,
            id: id || Date.now().toString(),
            timestamp: new Date().toISOString()
        });

        // Trigger Beams (Background Push)
        try {
            await beamsClient.publishToInterests([`room-${slug}`], {
                web: {
                    notification: {
                        title: "Telepathy! 💘",
                        body: `${emoji}`,
                        deep_link: `https://telepathy-pingpong.vercel.app/r/${slug}`,
                    },
                },
            });
        } catch (pushErr) {
            console.error('Beams Push Failed:', pushErr);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Message Send Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
