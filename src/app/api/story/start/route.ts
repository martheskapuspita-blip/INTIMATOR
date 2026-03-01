import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT_BASE, GENERATE_VARIASI_PROMPT } from '@/lib/systemPrompt';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';

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

    // Bangun prompt generator khusus untuk initial scene
    const randomSeed = Math.floor(Math.random() * 100000);
    const openingPromptContent = GENERATE_VARIASI_PROMPT
      .replace('[title]', scenario.title)
      .replace('[base_prompt]', scenario.base_prompt)
      .replace('[random_seed]', randomSeed.toString());

    // Tentukan instruksi POV berdasarkan gender pembaca
    const genderInstruction =
      gender === 'male'
        ? 'Gender User: Pria. Target: Wanita.'
        : gender === 'female'
        ? 'Gender User: Wanita. Target: Pria.'
        : 'Gender User: Wanita (Lesbian). Target: Wanita lain.';

    const finalUserPrompt = `${openingPromptContent}
${genderInstruction}

Mulai ceritanya sekarang dari awal.`;

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
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_BASE },
          { role: 'user', content: finalUserPrompt },
        ],
        temperature: 0.85,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      return NextResponse.json({ error: 'Gagal menghubungi AI' }, { status: 500 });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '{}';
    
    // Robust JSON extraction
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    } else {
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON Parse Error in start route. Raw content:', data.choices?.[0]?.message?.content);
      return NextResponse.json({ error: 'Format response AI tidak valid' }, { status: 500 });
    }

    const sceneText = parsed.scene_text || parsed.text || parsed.story || 'Teks cerita tidak dapat dimuat. Silakan coba lagi.';
    const choices = parsed.choices || [];

    const history = [
      { role: 'user', content: finalUserPrompt },
      { role: 'assistant', content: content },
    ];

    // Simpan sesi baru ke Supabase
    const { data: session, error: sessionError } = await supabaseServer
      .from('story_sessions')
      .insert({
        scenario_id: scenarioId,
        history,
        arousal_level: parsed.arousal_delta ?? 0,
        current_text: sceneText,
        status: parsed.status ?? 'ongoing',
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      console.error('Supabase insert error:', sessionError);
      return NextResponse.json({ error: 'Gagal menyimpan sesi ke database' }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.id,
      scenarioId,
      sceneText: sceneText,
      arousalDelta: parsed.arousal_delta ?? 0,
      choices: choices,
      status: parsed.status ?? 'ongoing',
      educationTip: parsed.education_tip ?? null,
      history,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
