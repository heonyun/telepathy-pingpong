"use client";

import { useEffect, useState, useRef } from 'react';
import { pusherClient } from '@/lib/pusher';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import * as PusherPushNotifications from "@pusher/push-notifications-web";

const PRESETS = ["❤️", "👍", "🔥", "😂", "🎉", "👻"];

// Safari-safe localStorage helper
const safeLocalStorage = {
    getItem: (key) => {
        try {
            if (typeof window !== 'undefined') {
                return localStorage.getItem(key);
            }
        } catch (e) {
            console.warn('localStorage access failed (Private Browsing?):', e);
        }
        return null;
    },
    setItem: (key, value) => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(key, value);
            }
        } catch (e) {
            console.warn('localStorage write failed (Private Browsing?):', e);
        }
    }
};

export default function RoomClient({ slug }) {
    const [messages, setMessages] = useState([]);
    const [centerEmoji, setCenterEmoji] = useState(null);
    const [animating, setAnimating] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const router = useRouter();
    const historyRef = useRef(null);

    // Initialize Device ID & Load History (Safe for Safari)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        let id = safeLocalStorage.getItem('deviceId');
        if (!id) {
            id = nanoid();
            safeLocalStorage.setItem('deviceId', id);
        }
        setDeviceId(id);

        const savedHistory = safeLocalStorage.getItem(`history-${slug}`);
        if (savedHistory) {
            try {
                setMessages(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }

        // Save current room for auto-rejoin
        safeLocalStorage.setItem('lastRoom', `/r/${slug}`);

        // Initialize Pusher Beams (Safe for Safari)
        const initBeams = async () => {
            try {
                // Check if Service Workers are supported (Safari Private Mode might block this)
                if (!('serviceWorker' in navigator)) {
                    console.log('Service Workers not supported, skipping Beams.');
                    return;
                }

                const beamsClient = new PusherPushNotifications.Client({
                    instanceId: '3f67ba05-7284-48f8-b80c-7b06871a2a1b', // Public ID is safe here
                });

                await beamsClient.start();
                await beamsClient.addDeviceInterest(`room-${slug}`);
                console.log('Successfully registered and subscribed to Beams!');
            } catch (e) {
                console.warn('Pusher Beams initialization failed (Expected in Safari Private Mode):', e);
            }
        };

        initBeams();

    }, [slug]);

    // Pusher Real-time Subscription
    useEffect(() => {
        if (!slug) return;

        const channelName = `presence-room-${slug}`;
        const channel = pusherClient.subscribe(channelName);

        channel.bind('message:new', (data) => {
            setCenterEmoji(data.emoji);
            setAnimating(true);

            // Add to history
            const newMessage = { id: data.id || nanoid(), emoji: data.emoji, timestamp: new Date().toISOString() };
            setMessages((prev) => {
                const updated = [...prev, newMessage];
                safeLocalStorage.setItem(`history-${slug}`, JSON.stringify(updated.slice(-50))); // Save last 50
                return updated;
            });

            setTimeout(() => setAnimating(false), 500);
        });

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [slug]);

    // Auto-scroll history
    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollLeft = historyRef.current.scrollWidth;
        }
    }, [messages]);

    const sendMessage = async (emoji) => {
        if (navigator.vibrate) navigator.vibrate(50);

        // Optimistic UI
        setCenterEmoji(emoji);
        setAnimating(true);
        setTimeout(() => setAnimating(false), 500);

        try {
            await fetch(`/api/rooms/${slug}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId, emoji }),
            });
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    // Drag vs Click detection for History
    const [dragStart, setDragStart] = useState(null);

    const handleMouseDown = (e) => setDragStart({ x: e.clientX, y: e.clientY });
    const handleTouchStart = (e) => setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });

    const handleClick = (e, emoji) => {
        if (!dragStart) return;
        const endX = e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : 0);
        const endY = e.clientY || (e.changedTouches ? e.changedTouches[0].clientY : 0);

        const dist = Math.sqrt(Math.pow(endX - dragStart.x, 2) + Math.pow(endY - dragStart.y, 2));
        if (dist < 10) { // It's a click, not a drag
            sendMessage(emoji);
        }
        setDragStart(null);
    };

    return (
        <div className="telepathy-container">
            {/* Header */}
            <div className="header-bar">
                <button onClick={() => router.push('/')} className="back-btn">
                    ⬅ One-Touch
                </button>
                <div className="status-indicator">
                    <span className="dot connected"></span>
                </div>
                <div style={{ flex: 1 }}></div>
                <div className="header-actions">
                    <button className="icon-btn" onClick={() => {
                        safeLocalStorage.setItem(`history-${slug}`, '[]');
                        setMessages([]);
                    }}>
                        🗑️
                    </button>
                    {/* Share Button (Web Share API) */}
                    <button className="icon-btn" onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: 'Telepathy PingPong',
                                text: 'Join my room!',
                                url: window.location.href,
                            }).catch(console.error);
                        } else {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copied to clipboard!');
                        }
                    }}>
                        🔗
                    </button>
                </div>
            </div>

            {/* Center Stage */}
            <div className="center-stage">
                <div
                    className={`big-heart ${animating ? 'pop' : ''}`}
                    onClick={() => centerEmoji && sendMessage(centerEmoji)}
                    style={{ cursor: 'pointer' }}
                >
                    {centerEmoji || "❤️"}
                </div>
                {!centerEmoji && <p className="hint-text">Tap to send</p>}
            </div>

            {/* Bottom Panel */}
            <div className="bottom-panel">
                <div className="toolbar">
                    <button
                        className="emoji-btn"
                        onClick={() => sendMessage("👋")}
                    >
                        👋
                    </button>

                    {/* Horizontal History */}
                    <div className="history" ref={historyRef}>
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className="history-item"
                                role="button"
                                tabIndex={0}
                                onMouseDown={handleMouseDown}
                                onTouchStart={handleTouchStart}
                                onMouseUp={(e) => handleClick(e, m.emoji)}
                                onTouchEnd={(e) => handleClick(e, m.emoji)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        sendMessage(m.emoji);
                                    }
                                }}
                                aria-label={`Resend ${m.emoji}`}
                            >
                                {m.emoji}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Emoji Grid */}
                <div className="emoji-grid">
                    {PRESETS.map(emoji => (
                        <button key={emoji} className="emoji-btn" onClick={() => sendMessage(emoji)}>
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
