"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { pusherClient } from '@/lib/pusher';
// import { useParams } from 'next/navigation'; // Passed from prop

const PRESETS = ['🍚', '🏠', '😴', '❓', '🆗'];

export default function RoomClient({ slug }) {
    const [mounted, setMounted] = useState(false);
    const [count, setCount] = useState(0);
    const [myDeviceId, setMyDeviceId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [echoStatus, setEchoStatus] = useState(null); // { id, emoji }

    const timerRef = useRef(null);
    const channelRef = useRef(null);
    const historyRef = useRef([]); // To safely access in callbacks if needed

    // 1. Init Device ID & Sound
    useEffect(() => {
        setMounted(true);
        let did = localStorage.getItem('deviceId');
        if (!did) {
            did = 'dev-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', did);
        }
        setMyDeviceId(did);

        // Initial dummy history
        setMessages([
            { id: 'welcome', emoji: '👋', senderDeviceId: 'system', createdAt: new Date() }
        ]);
    }, []);

    // 2. Pusher Connection
    useEffect(() => {
        if (!myDeviceId || !slug) return;

        const channelName = `presence-room-${slug}`;
        const channel = pusherClient.subscribe(channelName);
        channelRef.current = channel;

        channel.bind('pusher:subscription_succeeded', (members) => {
            setCount(members.count);
        });

        channel.bind('pusher:member_added', () => {
            setCount(prev => prev + 1);
        });

        channel.bind('pusher:member_removed', () => {
            setCount(prev => Math.max(0, prev - 1));
        });

        channel.bind('message:new', (data) => {
            handleNewMessage(data);
        });

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [myDeviceId, slug]);

    const handleNewMessage = (msg) => {
        setMessages(prev => [msg, ...prev].slice(0, 50)); // Keep last 50
        // Check Auto Echo
        if (msg.senderDeviceId !== myDeviceId) {
            startAutoEcho(msg);
        }
    };

    // 3. Auto Echo Logic
    const startAutoEcho = (msg) => {
        if (timerRef.current) clearTimeout(timerRef.current);

        setEchoStatus({ id: msg.id, emoji: msg.emoji });

        timerRef.current = setTimeout(() => {
            // Send Auto Echo
            sendMessage(msg.emoji, true);
            setEchoStatus(null);
            // Optional: Show toast "Auto replied!"
        }, 3000);
    };

    const cancelAutoEcho = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
            setEchoStatus(null);
        }
    }, []);

    // Global Interaction Listener to Cancel Echo
    useEffect(() => {
        if (!echoStatus) return;

        const events = ['mousedown', 'touchstart', 'scroll', 'keydown'];
        const handler = () => cancelAutoEcho();

        events.forEach(ev => window.addEventListener(ev, handler));
        return () => {
            events.forEach(ev => window.removeEventListener(ev, handler));
        };
    }, [echoStatus, cancelAutoEcho]);


    // 4. Send Message
    const sendMessage = async (emoji, isAuto = false) => {
        if (!isAuto) cancelAutoEcho(); // User action cancels pending echo

        // Optimistic UI update could go here, but let's wait for server echo for consistency or just push local
        // setMessages(prev => [{ id: Date.now(), emoji, senderDeviceId: myDeviceId }, ...prev]);

        try {
            await fetch(`/api/rooms/${slug}/messages`, {
                method: 'POST',
                body: JSON.stringify({ deviceId: myDeviceId, emoji })
            });
            // Animation trigger could happen here
        } catch (e) {
            console.error(e);
        }
    };

    if (!mounted) return <div className="container">Loading...</div>;

    return (
        <div className="room-container">
            {/* Header */}
            <div className="header">
                <div style={{ fontWeight: 'bold' }}>One-Touch</div>
                <div className="badge">👤 {count} received</div>
            </div>

            {/* Main Heart Area */}
            <div className="heart-stage">
                {echoStatus && <div className="auto-echo-ring"><div className="auto-echo-progress" /></div>}

                <div
                    className="big-heart"
                    onClick={() => sendMessage('❤️')}
                >
                    ❤️
                </div>
            </div>

            {/* Chat / Timeline */}
            <div className="controls">
                <div className="history">
                    {messages.slice(0, 5).map((m, i) => (
                        <div key={i} className="history-item" style={{
                            opacity: 1 - (i * 0.15),
                            transform: `scale(${1 - (i * 0.1)})`
                        }}>
                            {m.emoji}
                        </div>
                    ))}
                </div>

                {/* Presets */}
                <div className="emoji-grid">
                    {PRESETS.map(emoji => (
                        <button key={emoji} className="emoji-btn" onClick={() => sendMessage(emoji)}>
                            {emoji}
                        </button>
                    ))}
                    {/* Native Picker Hack */}
                    <div style={{ position: 'relative', overflow: 'hidden', width: '50px', height: '50px' }}>
                        <button className="emoji-btn" style={{ position: 'absolute', width: '100%', height: '100%' }}>➕</button>
                        <input
                            type="text"
                            style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                opacity: 0, fontSize: '50px', cursor: 'pointer'
                            }}
                            onChange={(e) => {
                                if (e.target.value) {
                                    // Simple regex or check if it's emoji-ish, or just send whatever char
                                    sendMessage(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {echoStatus && (
                <div className="toast">Auto-reply in 3s... Tap to cancel</div>
            )}
        </div>
    );
}
