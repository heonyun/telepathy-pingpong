"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { pusherClient } from '@/lib/pusher';

const PRESETS = ['🍚', '🏠', '😴', '❓', '🆗'];

export default function RoomClient({ slug }) {
    const [mounted, setMounted] = useState(false);
    const [count, setCount] = useState(0);
    const [myDeviceId, setMyDeviceId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [echoStatus, setEchoStatus] = useState(null);
    const [connState, setConnState] = useState('connecting');

    const timerRef = useRef(null);
    const channelRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        let did = localStorage.getItem('deviceId');
        if (!did) {
            did = 'dev-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', did);
        }
        setMyDeviceId(did);
        setMessages([{ id: 'welcome', emoji: '👋', senderDeviceId: 'system', createdAt: new Date() }]);

        // Request Notification Permission
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }

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

        channel.bind('pusher:subscription_error', (err) => {
            console.error('Sub Error:', err);
            setConnState('sub_error');
            alert('Chat connection failed (Auth error). Please refresh.');
        });

        channel.bind('pusher:member_added', () => setCount(prev => prev + 1));
        channel.bind('pusher:member_removed', () => setCount(prev => Math.max(0, prev - 1)));

        // Message Handler with Notification
        channel.bind('message:new', (data) => {
            setMessages(prev => [data, ...prev].slice(0, 50));

            if (data.senderDeviceId !== myDeviceId) {
                startAutoEcho(data);

                // Show Notification if hidden
                if (document.hidden && Notification.permission === 'granted') {
                    new Notification('텔레파시 도착! 💘', {
                        body: `${data.emoji} 메시지가 도착했습니다!`,
                        icon: '/icons/icon-192x192.png' // Icon if available
                    });
                }
            }
        });

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [myDeviceId, slug]);

    const startAutoEcho = (msg) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setEchoStatus({ id: msg.id, emoji: msg.emoji });
        timerRef.current = setTimeout(() => {
            sendMessage(msg.emoji, true);
            setEchoStatus(null);
        }, 3000);
    };

    const cancelAutoEcho = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
            setEchoStatus(null);
        }
    }, []);

    useEffect(() => {
        if (!echoStatus) return;
        const events = ['mousedown', 'touchstart', 'scroll', 'keydown'];
        const handler = () => cancelAutoEcho();
        events.forEach(ev => window.addEventListener(ev, handler));
        return () => events.forEach(ev => window.removeEventListener(ev, handler));
    }, [echoStatus, cancelAutoEcho]);

    const sendMessage = async (emoji, isAuto = false) => {
        if (!isAuto) cancelAutoEcho();
        try {
            await fetch(`/api/rooms/${slug}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId: myDeviceId, emoji })
            });
            // Optimistic update not needed as Pusher will echo back
        } catch (e) {
            console.error(e);
            alert('Send failed');
        }
    };

    if (!mounted) return <div className="container">Loading...</div>;

    return (
        <div className="room-container">
            <div className="header">
                <div style={{ fontWeight: 'bold' }}>
                    One-Touch
                    <span style={{
                        display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
                        marginLeft: '8px',
                        background: connState === 'connected' ? '#4ade80' :
                            connState === 'sub_error' ? '#ef4444' : '#fbbf24'
                    }} title={connState} />
                </div>
                <div className="badge">👤 {count} received</div>
            </div>

            <div className="heart-stage">
                {echoStatus && <div className="auto-echo-ring"><div className="auto-echo-progress" /></div>}
                <div className="big-heart" onClick={() => sendMessage('❤️')}>❤️</div>
            </div>

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
                <div className="emoji-grid">
                    {PRESETS.map(emoji => (
                        <button key={emoji} className="emoji-btn" onClick={() => sendMessage(emoji)}>{emoji}</button>
                    ))}
                    <div style={{ position: 'relative', overflow: 'hidden', width: '50px', height: '50px' }}>
                        <button className="emoji-btn" style={{ position: 'absolute', width: '100%', height: '100%' }}>➕</button>
                        <input type="text" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, fontSize: '50px', cursor: 'pointer' }}
                            onChange={(e) => { if (e.target.value) { sendMessage(e.target.value); e.target.value = ''; } }}
                        />
                    </div>
                </div>
            </div>
            {echoStatus && <div className="toast">Auto-reply in 3s... Tap to cancel</div>}
        </div>
    );
}
