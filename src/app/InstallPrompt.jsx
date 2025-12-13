"use client";

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isSamsung, setIsSamsung] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [guideType, setGuideType] = useState(null); // 'ios', 'samsung_manual'

    useEffect(() => {
        // 1. Check standalone
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsStandalone(true);
            return;
        }

        const ua = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(ua);
        const samsung = /samsungbrowser/.test(ua);

        setIsIOS(ios);
        setIsSamsung(samsung);

        // 2. Listen for install event (Android/Chrome/Samsung)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 3. Force show button/logic for known platforms if event is slow
        const timer = setTimeout(() => {
            if (!isStandalone) {
                if (ios) {
                    setShowInstallBtn(true);
                } else if (samsung) {
                    // Samsung often supports event, but if not fired, show manual guide button
                    setShowInstallBtn(true);
                }
            }
        }, 1000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearTimeout(timer);
        };
    }, [isStandalone]);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            // 1. Standard install prompt (Chrome, Samsung if event fired)
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    setShowInstallBtn(false);
                }
                setDeferredPrompt(null);
            });
        } else if (isIOS) {
            // 2. iOS Manual Guide
            setGuideType('ios');
            setShowGuide(true);
        } else if (isSamsung) {
            // 3. Samsung Manual Guide (if event didn't fire)
            setGuideType('samsung');
            setShowGuide(true);
        } else {
            // 4. Default fallback
            alert("브라우저 메뉴에서 '앱 설치' 또는 '홈 화면에 추가'를 찾아주세요!");
        }
    };

    if (isStandalone || !showInstallBtn) return null;

    return (
        <>
            <div className="install-banner">
                <div className="install-text">
                    <span>📲 <b>앱으로 설치하기</b><br /><small>전체화면 + 알림 기능!</small></span>
                </div>
                <button className="install-btn" onClick={handleInstallClick}>
                    설치
                </button>
                <button className="close-btn" onClick={() => setShowInstallBtn(false)}>✕</button>
            </div>

            {showGuide && (
                <div className="ios-guide-overlay" onClick={() => setShowGuide(false)}>
                    <div className="ios-guide-card" onClick={e => e.stopPropagation()}>
                        {guideType === 'ios' ? (
                            <>
                                <h3>아이폰 설치 가이드</h3>
                                <p>1. 하단 공유 버튼 <span style={{ fontSize: '1.5rem' }}>📤</span> 터치</p>
                                <p>2. 메뉴 내려서 <b>'홈 화면에 추가'</b></p>
                                <div className="guide-arrow">⬇️</div>
                            </>
                        ) : (
                            <>
                                <h3>삼성 인터넷 설치 가이드</h3>
                                <p>1. 주소창 오른쪽 <b>다운로드 아이콘(📥)</b></p>
                                <p>혹은</p>
                                <p>2. 하단 메뉴(≡) &gt; <b>'현재 페이지 추가'</b></p>
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
