"use client";

import { useState, useEffect } from 'react';

// Platform detection utilities
function getPlatform() {
    if (typeof window === 'undefined') return 'unknown';
    const ua = window.navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/samsungbrowser/.test(ua)) return 'samsung';
    if (/android/.test(ua)) return 'android';
    return 'desktop';
}

function isStandaloneMode() {
    if (typeof window === 'undefined') return false;
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
    );
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [platform, setPlatform] = useState('unknown');
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const currentPlatform = getPlatform();
        setPlatform(currentPlatform);

        // If already installed, do nothing
        if (isStandaloneMode()) return;

        // 1. Listen for standard beforeinstallprompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 2. Fallback for iOS/Samsung (or if event misses)
        // Delay to check if event fired effectively
        const timer = setTimeout(() => {
            if (!isStandaloneMode()) {
                const p = getPlatform();
                if (p === 'ios' || p === 'samsung') {
                    // Always offer manual guide access for these platforms
                    setShowInstallBtn(true);
                }
            }
        }, 800);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearTimeout(timer);
        };
    }, []);

    const handleInstallClick = async () => {
        // A. Priority: Standard Prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === 'accepted') {
                setShowInstallBtn(false);
            }
            setDeferredPrompt(null);
            return;
        }

        // B. Manual Guides based on Platform
        if (platform === 'ios' || platform === 'samsung') {
            setShowGuide(true);
            return;
        }

        // C. Generic Fallback
        alert("브라우저 메뉴에서 '앱 설치' 또는 '홈 화면에 추가'를 찾아주세요.");
    };

    if (!isMounted || isStandaloneMode()) return null;
    if (!showInstallBtn) return null;

    return (
        <>
            <div className="install-banner">
                <div className="install-text">
                    <span>📲 <b>앱으로 설치</b><br /><small>전체화면 + 알림!</small></span>
                </div>
                <button className="install-btn" onClick={handleInstallClick}>
                    설치
                </button>
                <button className="close-btn" onClick={() => setShowInstallBtn(false)}>✕</button>
            </div>

            {showGuide && (
                <div className="ios-guide-overlay" onClick={() => setShowGuide(false)}>
                    <div className="ios-guide-card" onClick={e => e.stopPropagation()}>
                        {platform === 'ios' ? (
                            <>
                                <h3>아이폰 설치 가이드</h3>
                                <p>1. <span style={{ fontSize: '1.3rem' }}>📤</span> <b>공유 버튼</b> 터치</p>
                                <p>2. <b>'홈 화면에 추가'</b> 선택</p>
                                <div className="guide-arrow">⬇️</div>
                            </>
                        ) : (
                            <>
                                <h3>삼성 인터넷 설치</h3>
                                <p>1. 주소창 옆 <b>📥 다운로드</b></p>
                                <p>혹은</p>
                                <p>2. 메뉴(≡) &gt; <b>'현재 페이지 추가'</b></p>
                                <div className="guide-arrow">⬇️</div>
                            </>
                        )}
                        <button className="ok-btn" onClick={() => setShowGuide(false)}>알겠습니다</button>
                    </div>
                </div>
            )}
        </>
    );
}
