"use client";

import { useEffect, useState, useRef } from 'react';
import { pusherClient } from '@/lib/pusher';

const PRESETS = ['🍚', '🏠', '😴', '❓', '🆗'];

export default function RoomClient({ slug }) {
    const [mounted, setMounted] = useState(false);
    const [count, setCount] = useState(0);
    const [myDeviceId, setMyDeviceId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [connState, setConnState] = useState('connecting');
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

        // Monitor connection state
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
            console.error('Sub Error:', err); // Error logs are okay to keep
            setConnState('sub_error');
            alert('Chat connection failed. Please refresh.');
        });

        channel.bind('pusher:member_added', () => setCount(prev => prev + 1));
        channel.bind('pusher:member_removed', () => setCount(prev => Math.max(0, prev - 1)));

        channel.bind('message:new', (data) => {
            setMessages(prev => [data, ...prev].slice(0, 50));

            if (data.senderDeviceId !== myDeviceId) {
                // Check urgency/visibilty for notification
                if (document.hidden && Notification.permission === 'granted') {
                    try {
                        new Notification('텔레파시 도착! 💘', {
                            body: `${data.emoji}`,
                            icon: '/icons/icon-192x192.png'
                        });
                    } catch (e) {
                        // Ignore notification errors in background
                    }
                }
            }
        });

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [myDeviceId, slug]);

    const requestNotifPermission = async () => {
        if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
            await Notification.requestPermission();
        }
    };

    const sendMessage = async (emoji) => {
        requestNotifPermission(); // Ask on first interaction

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
            navigator.clipboard.writeText(url).then(() => alert('주소 복사 완료! 친구에게 공유하세요. 🔗'));
        } else {
            prompt("주소를 복사하세요:", url);
        }
    };

    if (!mounted) return <div className="container">Loading...</div>;

    return (
        <div className="room-container">
            <div className="header">
                <div className="header-title">
                    One-Touch
                    <span style={{
                        display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                        marginLeft: '6px',
                        background: connState === 'connected' ? '#4ade80' :
                            connState === 'sub_error' ? '#ef4444' : '#fbbf24'
                    }} title={connState} />
                </div>
                <div className="header-controls">
                    <button className="icon-btn" onClick={copyLink} title="주소 복사">🔗</button>
                    <div className="badge">👤 {count}</div>
                </div>
            </div>

            <div className="heart-stage">
                <div className="big-heart" onClick={() => sendMessage('❤️')}>❤️</div>
                <div className="help-text">Tap heart to send</div>
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
        </div>
    );
}
