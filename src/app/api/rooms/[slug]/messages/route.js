import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';
import PushNotifications from '@pusher/push-notifications-server';

// Initialize Beams safely. If env vars are missing (e.g. build time), it remains null.
let beamsClient = null;
if (process.env.PUSHER_BEAMS_INSTANCE_ID && process.env.PUSHER_BEAMS_SECRET_KEY) {
    beamsClient = new PushNotifications({
        instanceId: process.env.PUSHER_BEAMS_INSTANCE_ID,
        secretKey: process.env.PUSHER_BEAMS_SECRET_KEY,
    });
} else {
    console.warn("Pusher Beams credentials missing. Push notifications will not be sent.");
}

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

        // Trigger Beams (Background Push) only if client is initialized
        if (beamsClient) {
            try {
                await beamsClient.publishToInterests([`room-${slug}`], {
                    web: {
                        notification: {
                            title: "Telepathy! 💘",
                            body: `${emoji}`,
                            deep_link: `https://telepathy-pingpong.vercel.app/r/${slug}`,
                        },
                        // Loopback filtering logic removed for now to prioritize Safari stability
                    },
                });
            } catch (pushErr) {
                console.error('Beams Push Failed:', pushErr);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Message Send Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
