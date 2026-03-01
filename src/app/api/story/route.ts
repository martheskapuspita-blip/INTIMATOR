import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/systemPrompt';

export async function POST(req: NextRequest) {
  try {
    const { history, choice, choiceText, arousalLevel } = await req.json();

    // Build context dari history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      {
        role: 'user',
        content: `Pilihan saya: ${choice}. "${choiceText}"
Level arousal saat ini: ${arousalLevel}/100

Lanjutkan cerita berdasarkan pilihan ini. Tunjukkan konsekuensi pilihan tersebut. Jika pilihan benar, naikkan ketegangan. Jika salah, tunjukkan reaksi penolakan halus.`,
      },
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
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages,
        temperature: 0.9,
        max_tokens: 1500,
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

    return NextResponse.json({
      sceneText: parsed.scene_text,
      arousalDelta: parsed.arousal_delta ?? 0,
      choices: parsed.choices ?? [],
      status: parsed.status ?? 'ongoing',
      educationTip: parsed.education_tip ?? null,
      newHistoryEntry: { role: 'assistant', content },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
