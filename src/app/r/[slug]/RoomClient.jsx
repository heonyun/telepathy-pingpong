"use client";

import { useEffect, useState, useRef } from 'react';
import { pusherClient } from '@/lib/pusher';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import * as PusherPushNotifications from "@pusher/push-notifications-web";

const PRESETS = ['🍚', '🏠', '😴', '❓', '🆗'];
const BEAMS_INSTANCE_ID = '4338e24b-f8ae-4687-9fb2-6d303d9441ff';

export default function RoomClient({ slug }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [count, setCount] = useState(0);
    const [myDeviceId, setMyDeviceId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [connState, setConnState] = useState('connecting');
    const [centerEmoji, setCenterEmoji] = useState('❤️');
    const [animating, setAnimating] = useState(false);

    const historyRef = useRef(null);
    const channelRef = useRef(null);
    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        setMounted(true);
        let did = localStorage.getItem('deviceId');
        if (!did) {
            did = 'dev-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', did);
        }
        setMyDeviceId(did);
        setMessages([{ id: 'welcome', emoji: '👋', senderDeviceId: 'system' }]);

        // Auto-Rejoin Save
        localStorage.setItem('lastRoom', slug);

        pusherClient.connection.bind('state_change', (states) => {
            setConnState(states.current);
        });
        setConnState(pusherClient.connection.state);

        // Pusher Beams Registration
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const beamsClient = new PusherPushNotifications.Client({
                instanceId: BEAMS_INSTANCE_ID,
            });

            beamsClient.start()
                .then(() => beamsClient.addDeviceInterest(`room-${slug}`))
                .then(() => console.log('Successfully registered and subscribed!'))
                .catch(console.error);
        }

    }, [slug]);

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
            const msg = { ...data, id: data.id || nanoid() };

            setMessages(prev => {
                const newHistory = [...prev, msg];
                if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
                return newHistory;
            });

            if (msg.senderDeviceId !== myDeviceId) {
                setCenterEmoji(msg.emoji);
                triggerAnimation();
                // In-app notification fallback if needed (but now we have Beams!)
            }
        });

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [myDeviceId, slug]);

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollLeft = historyRef.current.scrollWidth;
        }
    }, [messages]);

    const triggerAnimation = () => {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 200);
    };

    const sendMessage = async (emoji) => {
        setCenterEmoji(emoji);
        triggerAnimation();

        try {
            await fetch(`/api/rooms/${slug}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId: myDeviceId,
                    emoji,
                    id: nanoid()
                })
            });
        } catch (err) {
            console.error('Send failed:', err);
        }
    };

    const goHome = () => {
        if (confirm('방을 나가시겠습니까? (자동 입장도 해제됩니다)')) {
            localStorage.removeItem('lastRoom'); // Clear auto-rejoin
            router.push('/');
        }
    }

    const copyLink = () => {
        const url = window.location.href;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => alert('주소 복사 완료! 🔗'));
        } else {
            prompt("주소:", url);
        }
    };

    const handlePointerDown = (e) => {
        dragStart.current = { x: e.clientX, y: e.clientY };
    };

    const handleHistoryClick = (e, emoji) => {
        const dx = Math.abs(e.clientX - dragStart.current.x);
        const dy = Math.abs(e.clientY - dragStart.current.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const threshold = e.pointerType === 'touch' ? 10 : 5;

        if (distance > threshold) return; // It was a drag

        sendMessage(emoji);
        dragStart.current = { x: 0, y: 0 };
    };

    const handleKeyDown = (e, emoji) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            sendMessage(emoji);
        }
    };

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
                <div
                    className={`big-heart ${animating ? 'pop' : ''}`}
                    onClick={() => sendMessage(centerEmoji)}
                >
                    {centerEmoji}
                </div>
                <div className="help-text">Tap to send</div>
            </div>

            <div className="controls">
                <div className="history" ref={historyRef}>
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className="history-item"
                            role="button"
                            tabIndex={0}
                            aria-label={`Resend ${m.emoji}`}
                            onPointerDown={handlePointerDown}
                            onClick={(e) => handleHistoryClick(e, m.emoji)}
                            onKeyDown={(e) => handleKeyDown(e, m.emoji)}
                        >
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
