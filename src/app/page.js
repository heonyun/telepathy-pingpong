"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [joinUrl, setJoinUrl] = useState('');

    const createRoom = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/rooms', { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                router.push(data.url);
            } else {
                alert('Failed to create room');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating room');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (!joinUrl) return;

        // Extract slug from full URL or use as is
        try {
            const urlObj = new URL(joinUrl);
            const path = urlObj.pathname; // /r/xyz
            router.push(path);
        } catch {
            // Maybe it's just the slug?
            alert("올바른 주소(URL)를 입력해주세요!");
        }
    };

    return (
        <div className="container">
            <div className="title">One-Touch<br />Telepathy</div>
            <div className="subtitle">Just tap, and they will feel it.</div>

            <button
                className="btn-primary"
                onClick={createRoom}
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
            >
                {loading ? 'Creating...' : 'Start Telepathy'}
            </button>

            {/* 3. Join via Link Section */}
            <div style={{ marginTop: '40px', width: '80%', maxWidth: '300px' }}>
                <p style={{ marginBottom: '10px', color: '#888', fontSize: '0.9rem' }}>이미 방이 있나요?</p>
                <form onSubmit={handleJoin} style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        placeholder="https://..."
                        value={joinUrl}
                        onChange={(e) => setJoinUrl(e.target.value)}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '10px',
                            border: '1px solid #333', background: 'rgba(255,255,255,0.1)', color: 'white'
                        }}
                    />
                    <button type="submit" style={{
                        padding: '10px', borderRadius: '10px', border: 'none',
                        background: '#333', color: 'white', cursor: 'pointer'
                    }}>
                        GO
                    </button>
                </form>
            </div>
        </div>
    );
}
