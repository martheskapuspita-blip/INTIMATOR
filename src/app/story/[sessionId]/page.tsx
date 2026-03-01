'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStoryStore, Choice } from '@/store/storyStore';

export default function StoryPage() {
  const router = useRouter();
  const {
    gender, sessionId, arousalLevel, currentText, choices,
    history, status, educationTip,
    setStoryState, appendHistory, setLoading, resetStory,
  } = useStoryStore();

  const [isLoading, setIsLoadingLocal] = useState(false);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [isChoicesOpen, setIsChoicesOpen] = useState(true);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gender || !sessionId) router.push('/home');
  }, [gender, sessionId]);

  useEffect(() => {
    // Scroll text ke atas saat konten baru
    textRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentText]);

  const handleChoice = async (choice: Choice) => {
    if (isLoading || status !== 'ongoing') return;
    setChosenId(choice.id);
    setIsLoadingLocal(true);
    setLoading(true);

    const userEntry = {
      role: 'user' as const,
      content: `Aku memilih: ${choice.id}. "${choice.text}"
Level arousal saat ini: ${arousalLevel}/100
Lanjutkan cerita berdasarkan pilihan ini. Tunjukkan konsekuensi yang sesuai.`,
    };
    appendHistory(userEntry);

    try {
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: [...history, userEntry],
          arousalLevel,
          sessionId,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        alert('Gagal lanjut: ' + (data.error || 'Coba lagi'));
        setIsLoadingLocal(false);
        setLoading(false);
        return;
      }

      setStoryState({
        text: data.sceneText,
        arousalDelta: data.arousalDelta,
        choices: data.choices,
        status: data.status,
        educationTip: data.educationTip,
      });
      if (data.newHistoryEntry) appendHistory(data.newHistoryEntry);
    } catch {
      alert('Terjadi kesalahan koneksi.');
    }
    setIsLoadingLocal(false);
    setChosenId(null);
  };

  const isEnded = status === 'awkward_end' || status === 'orgasm_end';

  // Choices sheet height estimate: 56px per choice + header
  const CHOICES_SHEET_HEIGHT = choices.length > 0 ? choices.length * 68 + 80 : 0;

  const arousalGradient =
    arousalLevel >= 80
      ? 'linear-gradient(90deg, #c0392b, #e74c6b, #ff6b9d, #ffb086)'
      : arousalLevel >= 50
      ? 'linear-gradient(90deg, #c0392b, #e74c6b, #ff6b9d)'
      : 'linear-gradient(90deg, #8b2222, #c0392b)';

  const arousalLabel =
    arousalLevel < 25 ? '❄️ Dingin' :
    arousalLevel < 50 ? '🌡️ Hangat' :
    arousalLevel < 75 ? '🔥 Panas' : '💥 Membara';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      maxWidth: '480px',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── STICKY HEADER ── */}
      <div style={{
        flexShrink: 0,
        background: 'rgba(250,249,247,0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        padding: 'calc(10px + env(safe-area-inset-top)) 20px 12px',
        zIndex: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={() => { resetStory(); router.push('/home'); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1.3rem',
              padding: '4px 6px',
              marginLeft: '-6px',
              minWidth: '36px',
              minHeight: '36px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ←
          </button>
          <h1 className="font-display gradient-text" style={{ flex: 1, fontSize: '1rem', fontWeight: '700' }}>
            Intimora
          </h1>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: '700',
            color: arousalLevel >= 70 ? 'var(--accent-rose)' : 'var(--text-muted)',
            background: arousalLevel >= 70 ? 'rgba(231,76,107,0.1)' : 'transparent',
            padding: '4px 8px',
            borderRadius: '8px',
            border: arousalLevel >= 70 ? '1px solid rgba(231,76,107,0.2)' : '1px solid transparent',
          }}>
            {arousalLabel} · {arousalLevel}%
          </span>
        </div>

        {/* Arousal bar */}
        <div className="arousal-bar">
          <div
            className="arousal-fill"
            style={{ width: `${arousalLevel}%`, background: arousalGradient }}
          />
        </div>
      </div>

      {/* ── SCROLLABLE STORY TEXT ── */}
      <div
        ref={textRef}
        onClick={() => {
          if (isChoicesOpen && choices.length > 0) setIsChoicesOpen(false);
        }}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 20px 0',
          // padding bottom = choices sheet height so text isn't hidden behind it
          paddingBottom: isEnded ? '80px' : isChoicesOpen ? `${CHOICES_SHEET_HEIGHT + 40}px` : '80px',
          transition: 'padding-bottom 0.3s ease',
        }}
      >
        {/* Loading shimmer */}
        {isLoading && (
          <div style={{ paddingTop: '8px' }}>
            {[100, 80, 95, 60, 85, 40].map((w, i) => (
              <div
                key={i}
                className="shimmer"
                style={{
                  height: '16px',
                  width: `${w}%`,
                  marginBottom: '12px',
                  borderRadius: '6px',
                }}
              />
            ))}
            <div style={{
              textAlign: 'center',
              marginTop: '24px',
              display: 'flex',
              gap: '6px',
              justifyContent: 'center',
            }}>
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </div>
          </div>
        )}

        {/* Story text */}
        {!isLoading && currentText && (
          <div className="fade-in" style={{
            color: 'var(--text-primary)',
            fontSize: '1rem',
            lineHeight: '1.85',
            whiteSpace: 'pre-wrap',
            fontFamily: 'Georgia, "Times New Roman", serif',
            letterSpacing: '0.01em',
          }}>
            {currentText}
          </div>
        )}

        {/* Education tip */}
        {!isLoading && educationTip && (
          <div className="fade-in" style={{
            marginTop: '20px',
            background: 'rgba(201,168,76,0.07)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: '12px',
            padding: '14px',
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>📚</span>
              <div>
                <p style={{ color: 'var(--accent-gold)', fontSize: '0.7rem', fontWeight: '700', marginBottom: '4px', letterSpacing: '0.5px' }}>
                  EDUKASI
                </p>
                <p style={{ color: '#ff4d4d', fontSize: '0.85rem', lineHeight: '1.6', fontWeight: 500 }}>
                  {educationTip}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* End state */}
        {!isLoading && isEnded && (
          <div className="fade-in" style={{
            marginTop: '24px',
            textAlign: 'center',
            padding: '32px 16px',
            background: status === 'orgasm_end'
              ? 'linear-gradient(135deg, rgba(192,57,43,0.08), rgba(231,76,107,0.05))'
              : 'rgba(30,20,25,0.4)',
            borderRadius: '20px',
            border: `1px solid ${status === 'orgasm_end' ? 'rgba(231,76,107,0.2)' : 'var(--border-color)'}`,
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
              {status === 'orgasm_end' ? '💥' : '😬'}
            </div>
            <h2 className="font-display" style={{
              fontSize: '1.3rem',
              color: status === 'orgasm_end' ? 'var(--accent-rose)' : 'var(--text-secondary)',
              marginBottom: '6px',
            }}>
              {status === 'orgasm_end' ? 'Bliss Tercapai ✨' : 'Kesempatan Terlepas'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '24px' }}>
              {status === 'orgasm_end'
                ? 'Luar biasa! Kamu berhasil membaca sinyal dengan sempurna.'
                : 'Kamu salah membaca sinyal. Coba lagi dengan lebih peka!'}
            </p>
            <button
              className="btn-primary"
              onClick={() => { resetStory(); router.push('/home'); }}
              style={{ maxWidth: '240px', margin: '0 auto', borderRadius: '14px' }}
            >
              Pilih Fantasi Lain
            </button>
          </div>
        )}
      </div>

      {/* ── BOTTOM SHEET: CHOICES ── */}
      {!isLoading && !isEnded && choices.length > 0 && (
        <div 
          className="choices-sheet"
          style={{
            transform: isChoicesOpen ? 'translateY(0)' : 'translateY(calc(100% - 60px))',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            paddingTop: '20px',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
          }}
        >
          {/* Toggle Button */}
          <div 
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '6px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.5)',
              zIndex: 10,
            }}
            onClick={() => setIsChoicesOpen(!isChoicesOpen)}
          >
            <span style={{ 
              fontSize: '0.8rem', 
              color: '#333333',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {isChoicesOpen ? 'Tutup Pilihan ↓' : 'Buka Pilihan ↑'}
            </span>
          </div>

          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px',
            textAlign: 'center',
            opacity: isChoicesOpen ? 1 : 0,
            transition: 'opacity 0.2s',
          }}>
            Apa yang kamu lakukan?
          </p>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            opacity: isChoicesOpen ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: isChoicesOpen ? 'auto' : 'none'
          }}>
            {choices.map((choice) => (
              <button
                key={choice.id}
                className="choice-btn"
                onClick={() => {
                  handleChoice(choice);
                  setIsChoicesOpen(true);
                }}
                disabled={isLoading}
                style={{
                  opacity: chosenId && chosenId !== choice.id ? 0.45 : 1,
                  minHeight: '52px',
                }}
              >
                <span style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  background: 'rgba(192,57,43,0.14)',
                  color: 'var(--accent-rose)',
                  fontWeight: '700',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {choice.id}
                </span>
                <span style={{ flex: 1, fontSize: '0.88rem', lineHeight: '1.45', textAlign: 'left' }}>
                  {choice.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
