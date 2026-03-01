import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/systemPrompt';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { scenarioId, gender } = await req.json();

    // Fetch scenario dari Supabase
    const { data: scenario, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();

    if (error || !scenario) {
      return NextResponse.json({ error: 'Scenario tidak ditemukan' }, { status: 404 });
    }

    // Generate session ID unik
    const sessionId = crypto.randomUUID();

    // Build prompt pembuka
    const openingPrompt = `Scenario: ${scenario.title}
Gender pembaca: ${gender}
Base prompt: ${scenario.base_prompt}

Mulailah cerita dari awal. Scene pertama: perkenalkan setting dan karakter, lalu tunjukkan sinyal-sinyal gairah awal yang SANGAT HALUS. Jangan langsung eksplisit. Buat pembaca harus membaca situasi dengan cermat.`;

    // Panggil OpenRouter
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
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: openingPrompt },
        ],
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
      sessionId,
      scenarioId,
      sceneText: parsed.scene_text,
      arousalDelta: parsed.arousal_delta ?? 0,
      choices: parsed.choices ?? [],
      status: parsed.status ?? 'ongoing',
      educationTip: parsed.education_tip ?? null,
      history: [
        { role: 'user', content: openingPrompt },
        { role: 'assistant', content: content },
      ],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
