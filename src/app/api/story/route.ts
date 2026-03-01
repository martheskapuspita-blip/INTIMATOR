import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/systemPrompt';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { history, arousalLevel, sessionId } = await req.json();
    // history yang dikirim client sudah mengandung pilihan user terakhir (userEntry)
    // JANGAN tambah userEntry lagi di sini karena akan jadi duplikat

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history, // sudah termasuk: semua percakapan + pilihan user terbaru
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://intimora.app',
        'X-Title': 'Intimora',
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct',
        messages,
        temperature: 0.85,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      return NextResponse.json({ error: 'Gagal menghubungi AI' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Format response AI tidak valid' }, { status: 500 });
    }

    const newHistoryEntry = { role: 'assistant', content };
    const updatedHistory = [...history, newHistoryEntry];
    const newArousalLevel = Math.max(0, Math.min(100, arousalLevel + (parsed.arousal_delta ?? 0)));

    // Update sesi di Supabase jika sessionId ada
    if (sessionId) {
      const { error: updateError } = await supabaseServer
        .from('story_sessions')
        .update({
          history: updatedHistory,
          arousal_level: newArousalLevel,
          current_text: parsed.scene_text,
          status: parsed.status ?? 'ongoing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Supabase update error:', updateError);
      }
    }

    return NextResponse.json({
      sceneText: parsed.scene_text,
      arousalDelta: parsed.arousal_delta ?? 0,
      choices: parsed.choices ?? [],
      status: parsed.status ?? 'ongoing',
      educationTip: parsed.education_tip ?? null,
      newHistoryEntry,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
