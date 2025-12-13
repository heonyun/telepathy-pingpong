"use client";

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Force show after 500ms regardless of anything
        setTimeout(() => setShow(true), 500);
    }, []);

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            backgroundColor: '#ff007a', // Hot Pink for visibility
            color: 'white',
            padding: '20px',
            borderRadius: '16px',
            textAlign: 'center',
            zIndex: 999999, // Super high z-index
            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
            fontWeight: 'bold'
        }}>
            <p style={{ marginBottom: '10px' }}>🚧 DEBUG MODE 🚧</p>
            <p>앱 설치 배너가 보이나요?</p>
            <button onClick={() => alert('설치 로직 실행')} style={{
                marginTop: '10px', padding: '10px 20px', background: 'white', color: 'black', border: 'none', borderRadius: '10px'
            }}>
                네, 보입니다!
            </button>
        </div>
    );
}
