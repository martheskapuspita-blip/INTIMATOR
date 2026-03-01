'use client';

import { useRouter } from 'next/navigation';

export default function AgeGatePage() {
  const router = useRouter();

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      paddingTop: 'calc(24px + env(safe-area-inset-top))',
      paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
    }}>
      <div className="fade-in mobile-container" style={{ textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ marginBottom: '28px' }}>
          <h1 className="font-display gradient-text" style={{
            fontSize: '3rem',
            fontWeight: '700',
            letterSpacing: '-1px',
          }}>
            Intimora
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            marginTop: '6px',
            fontStyle: 'italic',
          }}>
            Novel Dewasa Interaktif & Edukasi Sex
          </p>
        </div>

        {/* Warning card */}
        <div className="card-dark" style={{ padding: '28px 24px', marginBottom: '24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔞</div>
          <h2 className="font-display" style={{
            fontSize: '1.25rem',
            marginBottom: '12px',
            color: 'var(--accent-rose)',
          }}>
            Konten Dewasa
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            lineHeight: '1.7',
            fontSize: '0.92rem',
            marginBottom: '16px',
          }}>
            Situs ini mengandung konten seksual eksplisit yang diperuntukkan{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              khusus untuk orang dewasa berusia 18 tahun ke atas.
            </strong>
          </p>
          <div style={{
            padding: '12px 14px',
            background: 'rgba(192, 57, 43, 0.08)',
            borderRadius: '10px',
            border: '1px solid rgba(192, 57, 43, 0.18)',
          }}>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.83rem',
              lineHeight: '1.6',
            }}>
              Dengan melanjutkan, kamu menyatakan berusia minimal{' '}
              <strong style={{ color: 'var(--accent-rose)' }}>18 tahun</strong>{' '}
              dan memahami konten ini bersifat dewasa dan vulgar.
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="btn-primary pulse-glow"
            onClick={() => router.push('/onboarding')}
            style={{ fontSize: '1rem', borderRadius: '16px', minHeight: '56px' }}
          >
            ✓ Saya 18+ Tahun — Lanjutkan
          </button>
          <button
            className="btn-secondary"
            onClick={() => (window.location.href = 'https://www.google.com')}
            style={{ fontSize: '0.88rem', minHeight: '48px' }}
          >
            Saya di bawah 18 — Keluar
          </button>
        </div>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.72rem',
          marginTop: '20px',
          lineHeight: '1.5',
        }}>
          Fantasi yang disajikan adalah fiksi. Intimora mendukung edukasi seksual yang sehat.
        </p>
      </div>
    </main>
  );
}
