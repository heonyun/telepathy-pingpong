"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const createRoom = async () => {
        setLoading(true);

        // Get/Create Device ID
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'dev-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }

        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId })
            });
            const data = await res.json();
            if (data.url) {
                router.push(data.url);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 className="title">One-Touch<br />Telepathy 💘</h1>
            <p className="subtitle">Mal haseyo? Ani, just touch.</p>

            <button className="btn-primary" onClick={createRoom} disabled={loading}>
                {loading ? 'Creating...' : 'Start Telepathy'}
            </button>
        </div>
    );
}
