import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';
import PushNotifications from '@pusher/push-notifications-server';

const beamsClient = new PushNotifications({
    instanceId: '4338e24b-f8ae-4687-9fb2-6d303d9441ff',
    secretKey: '609E498E01AB06C36D19FE826ADCF9A19C6545F2841674A73737782BC9A7A502',
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
        // We catch errors here so real-time msgs don't fail if push fails
        try {
            await beamsClient.publishToInterests([`room-${slug}`], {
                web: {
                    notification: {
                        title: "Telepathy! 💘",
                        body: `${emoji}`,
                        // Use a generic icon or app icon
                        // deep_link is supported by Beams web SDK to open the URL
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
