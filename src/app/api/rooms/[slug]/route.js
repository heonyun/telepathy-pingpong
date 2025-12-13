import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    const { slug } = params;
    const roomId = `room:${slug}`;

    try {
        const room = await db.hgetall(roomId);

        if (!room || room.isDeleted) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        return NextResponse.json(room);
    } catch (error) {
        console.error("Get Room Error", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
