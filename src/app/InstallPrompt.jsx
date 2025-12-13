"use client";

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode (installed)
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsStandalone(true);
            return;
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // Capture install prompt event (mostly Android/Desktop Chrome)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // If iOS, show button always (since we can't detect 'can install' easily, just show strict guide)
        // But usually we only show if not standalone
        if (ios && !isStandalone) {
            setShowInstallBtn(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [isStandalone]);

    const handleInstallClick = () => {
        if (isIOS) {
            setShowIOSGuide(true);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                    setShowInstallBtn(false);
                }
                setDeferredPrompt(null);
            });
        } else {
            // Fallback or weird state
            alert("브라우저 메뉴에서 '앱 설치' 또는 '홈 화면에 추가'를 눌러주세요!");
        }
    };

    if (isStandalone || !showInstallBtn) return null;

    return (
        <>
            <div className="install-banner">
                <div className="install-text">
                    <span>📲 <b>앱으로 설치하세요!</b><br /><small>알림도 받고 전체화면으로 즐기세요.</small></span>
                </div>
                <button className="install-btn" onClick={handleInstallClick}>
                    설치하기
                </button>
                <button className="close-btn" onClick={() => setShowInstallBtn(false)}>✕</button>
            </div>

            {showIOSGuide && (
                <div className="ios-guide-overlay" onClick={() => setShowIOSGuide(false)}>
                    <div className="ios-guide-card" onClick={e => e.stopPropagation()}>
                        <h3>아이폰 설치 가이드 🍎</h3>
                        <p>1. 하단 공유 버튼 <span style={{ fontSize: '1.5rem' }}>📤</span> 을 누르세요.</p>
                        <p>2. 메뉴를 내려서 <b>'홈 화면에 추가'</b>를 선택하세요.</p>
                        <div className="guide-arrow">⬇️ 여기쯤 있어요!</div>
                        <button className="ok-btn" onClick={() => setShowIOSGuide(false)}>알겠습니다</button>
                    </div>
                </div>
            )}
        </>
    );
}
