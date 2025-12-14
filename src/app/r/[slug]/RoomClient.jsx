"use client";

import { useEffect, useState, useRef } from 'react';
import { pusherClient } from '@/lib/pusher';
import { useRouter } from 'next/navigation';

const PRESETS = ['🍚', '🏠', '😴', '❓', '🆗'];

export default function RoomClient({ slug }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [count, setCount] = useState(0);
    const [myDeviceId, setMyDeviceId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [connState, setConnState] = useState('connecting');
    const [centerEmoji, setCenterEmoji] = useState('❤️'); // Default heart
    const [animating, setAnimating] = useState(false); // For pop animation

    const channelRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        let did = localStorage.getItem('deviceId');
        if (!did) {
            did = 'dev-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', did);
        }
        setMyDeviceId(did);
        setMessages([{ id: 'welcome', emoji: '👋', senderDeviceId: 'system' }]);

        pusherClient.connection.bind('state_change', (states) => {
            setConnState(states.current);
        });
        setConnState(pusherClient.connection.state);
    }, []);

    useEffect(() => {
        if (!myDeviceId || !slug) return;

        const channelName = `presence-room-${slug}`;
        const channel = pusherClient.subscribe(channelName);
        channelRef.current = channel;

        channel.bind('pusher:subscription_succeeded', (members) => {
            setCount(members.count);
        });

        channel.bind('pusher:member_added', () => setCount(prev => prev + 1));
        channel.bind('pusher:member_removed', () => setCount(prev => Math.max(0, prev - 1)));

        channel.bind('message:new', (data) => {
            setMessages(prev => [data, ...prev].slice(0, 50));

            // 1. Receiver Animation & Emoji Update
            if (data.senderDeviceId !== myDeviceId) {
                setCenterEmoji(data.emoji); // Show received emoji
                triggerAnimation();

                if (document.hidden && Notification.permission === 'granted') {
                    try {
                        new Notification('텔레파시 도착! 💘', {
                            body: `${data.emoji}`,
                            icon: '/icons/icon-192x192.png'
                        });
                    } catch (e) { }
                }
            }
        });

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [myDeviceId, slug]);

    const triggerAnimation = () => {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 200); // 200ms pop
    };

    const sendMessage = async (emoji) => {
        // 2. Sender Animation & Emoji Update
        setCenterEmoji(emoji);
        triggerAnimation();

        if (Notification.permission === 'default') Notification.requestPermission();

        try {
            await fetch(`/api/rooms/${slug}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId: myDeviceId, emoji })
            });
        } catch {
            alert('Send failed');
        }
    };

    const copyLink = () => {
        const url = window.location.href;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => alert('주소 복사 완료! 🔗'));
        } else {
            prompt("주소를 복사하세요:", url);
        }
    };

    const goHome = () => {
        if (confirm('방을 나가시겠습니까?')) router.push('/');
    }

    if (!mounted) return <div className="container">Loading...</div>;

    return (
        <div className="room-container">
            <div className="header">
                <div className="header-title" onClick={goHome} style={{ cursor: 'pointer' }}>
                    <span style={{ marginRight: '5px' }}>🔙</span>
                    One-Touch
                    <span style={{
                        display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                        marginLeft: '6px',
                        background: connState === 'connected' ? '#4ade80' : '#fbbf24'
                    }} />
                </div>
                <div className="header-controls">
                    <button className="icon-btn" onClick={copyLink}>🔗</button>
                    <div className="badge">👤 {count}</div>
                </div>
            </div>

            <div className="heart-stage">
                {/* 5. Dynamic Idle & Click Animation */}
                <div
                    className={`big-heart ${animating ? 'pop' : ''}`}
                    onClick={() => sendMessage(centerEmoji)}
                >
                    {centerEmoji}
                </div>
                <div className="help-text">Tap to send</div>
            </div>

            <div className="controls">
                {/* 4. History Order: Recent on RIGHT (use flex-direction: row-reverse or just justify-end) */}
                <div className="history" style={{ justifyContent: 'flex-end' }}>
                    {messages.slice(0, 5).map((m, i) => (
                        <div key={i} className="history-item">
                            {m.emoji}
                        </div>
                    ))}
                </div>
                <div className="emoji-grid">
                    {PRESETS.map(emoji => (
                        <button key={emoji} className="emoji-btn" onClick={() => sendMessage(emoji)}>{emoji}</button>
                    ))}
                    <div style={{ position: 'relative', overflow: 'hidden', width: '50px', height: '50px' }}>
                        <button className="emoji-btn" style={{ position: 'absolute', width: '100%', height: '100%' }}>➕</button>
                        <input type="text" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, fontSize: '50px', cursor: 'pointer' }}
                            onChange={(e) => {
                                if (e.target.value) {
                                    sendMessage(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
