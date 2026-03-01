'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStoryStore } from '@/store/storyStore';
import { supabase } from '@/lib/supabase';

interface Scenario {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  category: string;
  gender_target: string;
}

const genderMap: Record<string, string[]> = {
  male: ['male'],
  female: ['female'],
  lesbian: ['female_lesbian'],
};

const categoryConfig: Record<string, { emoji: string; color: string }> = {
  hetero_pria:   { emoji: '🔥', color: 'rgba(192,57,43,0.15)' },
  hetero_wanita: { emoji: '💋', color: 'rgba(231,76,107,0.12)' },
  lesbian:       { emoji: '🌸', color: 'rgba(201,168,76,0.10)' },
};

export default function HomePage() {
  const router = useRouter();
  const { gender, setSession, resetStory } = useStoryStore();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!gender) { router.push('/onboarding'); return; }
    fetchScenarios();
  }, [gender]);

  const fetchScenarios = async () => {
    setLoading(true);
    const targets = genderMap[gender!] || ['male'];
    const { data, error } = await supabase
      .from('scenarios')
      .select('id, title, description, thumbnail, category, gender_target')
      .in('gender_target', targets);
    if (!error && data) setScenarios(data);
    setLoading(false);
  };

  const startStory = async (scenario: Scenario) => {
    setStarting(scenario.id);
    resetStory();
    try {
      const res = await fetch('/api/story/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenario.id, gender }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert('Gagal memulai cerita: ' + (data.error || 'Coba lagi'));
        setStarting(null);
        return;
      }
      setSession(data.sessionId, data.scenarioId);
      useStoryStore.getState().setStoryState({
        text: data.sceneText,
        arousalDelta: data.arousalDelta,
        choices: data.choices,
        status: data.status,
        educationTip: data.educationTip,
      });
      data.history?.forEach((h: { role: 'user' | 'assistant'; content: string }) => {
        useStoryStore.getState().appendHistory(h);
      });
      router.push(`/story/${data.sessionId}`);
    } catch {
      alert('Terjadi kesalahan. Periksa koneksi dan API keys.');
      setStarting(null);
    }
  };

  const genderLabel: Record<string, string> = {
    male: 'Pria Hetero',
    female: 'Wanita Hetero',
    lesbian: 'Wanita Lesbian',
  };

  return (
    <main style={{
      minHeight: '100dvh',
      paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
    }}>
      {/* Sticky top bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(10,6,8,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        padding: 'calc(12px + env(safe-area-inset-top)) 20px 12px',
      }}>
        <div className="mobile-container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 className="font-display gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
              Intimora
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1px' }}>
              Mode:{' '}
              <span style={{ color: 'var(--accent-rose)' }}>
                {genderLabel[gender || 'male']}
              </span>
            </p>
          </div>
          <button
            onClick={() => router.push('/onboarding')}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              minHeight: '40px',
            }}
          >
            Ganti
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>

        {/* Section header */}
        {!loading && scenarios.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h2 className="font-display" style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Pilih Fantasimu
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {scenarios.length} skenario tersedia
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Memuat skenario...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && scenarios.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📭</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Belum ada skenario. Pastikan data sudah dimasukkan ke Supabase.
            </p>
          </div>
        )}

        {/* Single column card list (mobile-optimized) */}
        {!loading && scenarios.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {scenarios.map((s, i) => {
              const cfg = categoryConfig[s.category] || categoryConfig['hetero_pria'];
              return (
                <button
                  key={s.id}
                  className="scenario-card fade-in"
                  onClick={() => startStory(s)}
                  disabled={!!starting}
                  style={{
                    animationDelay: `${i * 0.04}s`,
                    opacity: starting && starting !== s.id ? 0.55 : 1,
                    cursor: starting === s.id ? 'wait' : starting ? 'default' : 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflow: 'hidden' }}>
                    {/* Left thumb area */}
                    <div style={{
                      width: '90px',
                      minHeight: '90px',
                      background: `linear-gradient(135deg, #150910, #220f18)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.4rem',
                      flexShrink: 0,
                    }}>
                      {cfg.emoji}
                    </div>

                    {/* Right content */}
                    <div style={{ flex: 1, padding: '14px 14px', minWidth: 0 }}>
                      <span className="badge" style={{ marginBottom: '6px' }}>
                        {s.category.replace('_', ' ')}
                      </span>
                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        marginBottom: '5px',
                        lineHeight: '1.35',
                      }}>
                        {s.title}
                      </h3>
                      <p style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {s.description}
                      </p>

                      {/* Loading indicator */}
                      {starting === s.id && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                          <span className="loading-dot" style={{ width: '5px', height: '5px' }} />
                          <span className="loading-dot" style={{ width: '5px', height: '5px' }} />
                          <span className="loading-dot" style={{ width: '5px', height: '5px' }} />
                        </div>
                      )}
                    </div>

                    {/* Chevron */}
                    <div style={{
                      paddingRight: '14px',
                      color: 'var(--text-muted)',
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}>›</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
