'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStoryStore, Gender } from '@/store/storyStore';

const genderOptions: { value: Gender; label: string; emoji: string; desc: string }[] = [
  { value: 'male',    label: 'Pria Hetero',    emoji: '👨', desc: 'Fantasi bersama wanita sensual' },
  { value: 'female',  label: 'Wanita Hetero',  emoji: '👩', desc: 'Fantasi bersama pria dominan' },
  { value: 'lesbian', label: 'Wanita Lesbian', emoji: '👭', desc: 'Fantasi intim sesama wanita' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const setGender = useStoryStore((s) => s.setGender);
  const [selected, setSelected] = useState<Gender | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setGender(selected);
    router.push('/home');
  };

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 20px',
      paddingTop: 'calc(48px + env(safe-area-inset-top))',
      paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
    }}>
      <div className="fade-in mobile-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="font-display gradient-text" style={{
            fontSize: '2.2rem',
            fontWeight: '700',
            marginBottom: '6px',
          }}>
            Intimora
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Sesuaikan fantasi untukmu
          </p>
        </div>

        {/* Question */}
        <h2 className="font-display" style={{
          fontSize: '1.35rem',
          color: 'var(--text-primary)',
          marginBottom: '6px',
        }}>
          Kamu adalah...
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Pilih untuk menyesuaikan skenario yang ditampilkan
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {genderOptions.map((opt) => (
            <button
              key={opt.value}
              className={`gender-card ${selected === opt.value ? 'selected' : ''}`}
              onClick={() => setSelected(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '18px 20px',
                width: '100%',
                background: selected === opt.value ? 'rgba(192,57,43,0.08)' : 'var(--bg-card)',
                minHeight: '72px',
              }}
            >
              <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{opt.emoji}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{
                  fontWeight: '600',
                  fontSize: '0.98rem',
                  color: 'var(--text-primary)',
                  marginBottom: '3px',
                }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {opt.desc}
                </div>
              </div>
              <span style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                border: `2px solid ${selected === opt.value ? 'var(--accent-rose)' : 'var(--border-color)'}`,
                background: selected === opt.value ? 'var(--accent-rose)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.65rem',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}>
                {selected === opt.value ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: '28px' }}>
          <button
            className="btn-primary"
            onClick={handleContinue}
            disabled={!selected}
            style={{
              opacity: selected ? 1 : 0.35,
              cursor: selected ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              minHeight: '56px',
              borderRadius: '16px',
            }}
          >
            Mulai Fantasiku →
          </button>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            textAlign: 'center',
            marginTop: '14px',
          }}>
            Pilihan bisa diubah kapan saja
          </p>
        </div>
      </div>
    </main>
  );
}
