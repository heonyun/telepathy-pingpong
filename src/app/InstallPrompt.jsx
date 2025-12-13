"use client";

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsStandalone(true);
            return;
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Fallback: If event doesn't fire within 2 seconds, show it anyway for non-standalone
        const timer = setTimeout(() => {
            if (!isStandalone) {
                setShowInstallBtn(true);
            }
        }, 2000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearTimeout(timer);
        };
    }, [isStandalone]);

    const handleInstallClick = () => {
        if (isIOS) {
            setShowIOSGuide(true);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    setShowInstallBtn(false);
                }
                setDeferredPrompt(null);
            });
        } else {
            // PC Chrome etc where event didn't fire but user clicked
            alert("브라우저 주소창 우측의 '앱 설치 아이콘(🖥️⬇️)'이나 메뉴의 '앱 설치'를 이용해주세요!");
        }
    };

    if (isStandalone || !showInstallBtn) return null;

    return (
        <>
            <div className="install-banner">
                <div className="install-text">
                    <span>📲 <b>앱으로 설치하기</b><br /><small>전체화면으로 더 몰입감 있게!</small></span>
                </div>
                <button className="install-btn" onClick={handleInstallClick}>
                    설치
                </button>
                <button className="close-btn" onClick={() => setShowInstallBtn(false)}>✕</button>
            </div>

            {showIOSGuide && (
                <div className="ios-guide-overlay" onClick={() => setShowIOSGuide(false)}>
                    <div className="ios-guide-card" onClick={e => e.stopPropagation()}>
                        <h3>아이폰 설치 가이드</h3>
                        <p>1. 하단 공유 버튼 <span style={{ fontSize: '1.5rem' }}>📤</span> 터치</p>
                        <p>2. <b>'홈 화면에 추가'</b> 선택</p>
                        <div className="guide-arrow">⬇️</div>
                        <button className="ok-btn" onClick={() => setShowIOSGuide(false)}>확인</button>
                    </div>
                </div>
            )}
        </>
    );
}
