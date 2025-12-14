"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Auto-Rejoin Logic
    useEffect(() => {
        const lastRoom = localStorage.getItem('lastRoom');
        if (lastRoom) {
            router.replace(`/r/${lastRoom}`);
        }
    }, [router]);

    const handleCreateRoom = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/rooms', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to create room');
            const data = await res.json();
            router.push(`/r/${data.slug}`);
        } catch (e) {
            console.error(e);
            alert('Error creating room');
            setLoading(false);
        }
    };

    const [joinUrl, setJoinUrl] = useState('');
    const handleJoin = (e) => {
        e.preventDefault();
        if (!joinUrl) return;
        try {
            // Extract slug from URL if pasted, or use raw text
            const urlParts = joinUrl.split('/');
            const slug = urlParts[urlParts.length - 1] || joinUrl;
            if (slug) router.push(`/r/${slug}`);
        } catch (err) {
            alert('Invalid Link');
        }
    }

    return (
        <div className="container">
            <h1 className="title">Telepathy<br />PingPong 💖</h1>
            <p className="subtitle">Instant Heartbeat Connection</p>

            <button className="btn-primary" onClick={handleCreateRoom} disabled={loading}>
                {loading ? 'Creating...' : 'Start New Room'}
            </button>

            <div style={{ marginTop: '40px', width: '100%', maxWidth: '300px' }}>
                <form onSubmit={handleJoin} style={{ display: 'flex', gap: '5px' }}>
                    <input
                        type="text"
                        placeholder="https://... or code"
                        value={joinUrl}
                        onChange={(e) => setJoinUrl(e.target.value)}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                            background: 'rgba(255,255,255,0.1)', color: 'white'
                        }}
                    />
                    <button type="submit" style={{
                        background: '#333', color: 'white', cursor: 'pointer',
                        padding: '10px', borderRadius: '10px', border: 'none'
                    }}>
                        GO
                    </button>
                </form>
            </div>
        </div>
    );
}
