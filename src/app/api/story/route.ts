import { NextRequest, NextResponse } from 'next/server';
import {
  SYSTEM_PROMPT_BASE,
  BLENDED_ORGASM_WANITA_SUPERDETAIL,
  BLENDED_ORGASM_PRIA_HETERO_PROMPT,
  LESBIAN_BLENDED_PROMPT,
  ADVANCED_EDGING_PROMPT,
  SCISSORING_BLENDED_PROMPT
} from '@/lib/systemPrompt';
import { supabaseServer } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { history, arousalLevel, sessionId } = await req.json();
    
    // Ambil data sesi untuk tahu scenario & gendertarget
    const { data: session } = await supabaseServer
      .from('story_sessions')
      .select('scenario_id, user_id')
      .eq('id', sessionId)
      .single();

    let genderTarget = 'hetero_male'; // fallback
    if (session) {
       const { data: scenario } = await supabase
         .from('scenarios')
         .select('gender_target')
         .eq('id', session.scenario_id)
         .single();
       if (scenario) genderTarget = scenario.gender_target;
    }

    // history yang dikirim client sudah mengandung pilihan user terakhir (userEntry)
    const latestUserChoice = history[history.length - 1]?.content.toLowerCase() || '';

    // BANGUN DYNAMIC SYSTEM PROMPT
    let injectedPrompt = SYSTEM_PROMPT_BASE;

    // 1. Cek Advanced Edging (arousal >= 65 + kata kunci)
    const isEdgingKeywords = ['tahan', 'pelanin', 'napas', 'breath', 'eye contact', 'tatap mata', 'bisik', 'whisper'].some(k => latestUserChoice.includes(k));
    if (arousalLevel >= 65 && isEdgingKeywords) {
      injectedPrompt += '\n\n' + ADVANCED_EDGING_PROMPT;
    }

    // 2. Cek Scissoring (arousal >= 65 + kata kunci khusus lesbian)
    const isScissoringKeywords = ['scissor', 'tribbing', 'gesek memek', 'saling gesek'].some(k => latestUserChoice.includes(k));
    if (arousalLevel >= 65 && isScissoringKeywords && genderTarget === 'female_lesbian') {
      injectedPrompt += '\n\n' + SCISSORING_BLENDED_PROMPT;
    }

    // 3. Cek Blended Orgasm (arousal >= 75 + stimulasi ganda)
    if (arousalLevel >= 75) {
      const isDualStim = ['klit', 'g-spot', 'jari', 'prostate', 'pantat', 'lidah', 'payudara', 'puting'].some(k => latestUserChoice.includes(k));
      if (isDualStim || isScissoringKeywords) {
        if (genderTarget === 'female_lesbian') {
          injectedPrompt += '\n\n' + LESBIAN_BLENDED_PROMPT;
        } else if (genderTarget === 'female') {
          injectedPrompt += '\n\n' + BLENDED_ORGASM_WANITA_SUPERDETAIL;
        } else {
          injectedPrompt += '\n\n' + BLENDED_ORGASM_PRIA_HETERO_PROMPT;
        }
      }
    }

    const messages = [
      { role: 'system', content: injectedPrompt },
      ...history,
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
