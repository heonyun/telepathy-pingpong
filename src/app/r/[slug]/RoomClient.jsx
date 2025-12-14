"use client";

import { useEffect, useState, useRef } from 'react';
import { notFound, useRouter } from 'next/navigation';
import * as PusherPushNotifications from "@pusher/push-notifications-web";
import { pusherClient } from '@/lib/pusher';
import { nanoid } from 'nanoid';

// --- Pure IndexedDB Helper (No Library) ---
const DB_NAME = 'telepathy-db';
const STORE_NAME = 'settings';

function saveDeviceIdToDB(deviceId) {
    if (!window.indexedDB) return;
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
        }
    };

    request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(deviceId, 'myDeviceId');
    };
}
// ------------------------------------------

export default function RoomClient({ slug }) {
    const [messages, setMessages] = useState([]);
    const [centerEmoji, setCenterEmoji] = useState('❤️');
    const [popAnimation, setPopAnimation] = useState(false);
    const [connState, setConnState] = useState('connecting');
    const [myDeviceId, setMyDeviceId] = useState(null);
    const router = useRouter();

    const scrollRef = useRef(null);

    // 1. Auto-Rejoin Persistence & Beams Setup
    useEffect(() => {
        if (!slug) return;
        localStorage.setItem('lastRoom', slug);

        // --- ID Management ---
        let did = localStorage.getItem('deviceId');
        if (!did) {
            did = nanoid();
            localStorage.setItem('deviceId', did);
        }
        setMyDeviceId(did);
        saveDeviceIdToDB(did); // Save to IndexedDB for SW
        // ---------------------

        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.PusherPushNotifications) {
            const beamsClient = new PusherPushNotifications.Client({
                instanceId: '4338e24b-f8ae-4687-9fb2-6d303d9441ff', // This is public ID, safe to expose
            });

            beamsClient.start()
                .then(() => beamsClient.addDeviceInterest(`room-${slug}`))
                .then(() => console.log('Successfully registered and subscribed!'))
                .catch(console.error);
        }
    }, [slug]);

    // 2. Pusher Channel Subscription
    useEffect(() => {
        const channelName = `presence-room-${slug}`;
        const channel = pusherClient.subscribe(channelName);

        channel.bind('pusher:subscription_succeeded', () => setConnState('connected'));
        channel.bind('pusher:subscription_error', () => setConnState('error'));

        channel.bind('message:new', (data) => {
            // Add unique ID if missing
            const msg = { ...data, id: data.id || nanoid() };

            setMessages((prev) => {
                const newHistory = [...prev, msg];
                if (newHistory.length > 50) newHistory.shift();
                return newHistory;
            });

            setCenterEmoji(msg.emoji);
            triggerAnimation();
        });

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [slug]);

    // Auto-scroll history
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [messages]);

    const triggerAnimation = () => {
        setPopAnimation(true);
        setTimeout(() => setPopAnimation(false), 300);
    };

    const sendMessage = async (emoji) => {
        if (!myDeviceId) return;

        // Optimistic update
        setCenterEmoji(emoji);
        triggerAnimation();

        try {
            await fetch(`/api/rooms/${slug}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emoji,
                    deviceId: myDeviceId,
                    id: nanoid()
                }),
            });
        } catch (error) {
            console.error('Send failed', error);
        }
    };

    const goHome = () => {
        localStorage.removeItem('lastRoom');
        router.push('/');
    };

    // Robust Drag Detection
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e) => {
        setIsDragging(false);
        startPos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e) => {
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
            setIsDragging(true);
        }
    };

    return (
        <div className="telepathy-container">
            {/* Header */}
            <div className="header-bar">
                <button onClick={goHome} className="back-btn">
                    ⬅ One-Touch
                </button>
                <div className="status-indicator">
                    <span className={`dot ${connState}`}></span>
                </div>
                <div style={{ flex: 1 }}></div>
                <div className="header-actions">
                    <button className="icon-btn">🔗</button>
                    <button className="icon-btn">👤 1</button>
                </div>
            </div>

            {/* Main Center Emoji */}
            <div className="center-stage">
                <div
                    className={`big-heart ${popAnimation ? 'pop' : ''}`}
                    onClick={() => sendMessage('❤️')}
                    style={{ cursor: 'pointer' }}
                >
                    {centerEmoji}
                </div>
                <div className="hint-text">Tap to send</div>
            </div>

            {/* Emoji Toolbar & History */}
            <div className="bottom-panel">
                <div className="toolbar">
                    <button className="emoji-btn" onClick={() => sendMessage('👋')}>👋</button>
                    <div className="history" ref={scrollRef}>
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className="history-item"
                                role="button"
                                tabIndex={0}
                                aria-label={`Resend ${m.emoji}`}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onClick={() => !isDragging && sendMessage(m.emoji)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        sendMessage(m.emoji);
                                    }
                                }}
                            >
                                {m.emoji}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
