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
    const { history, arousalLevel, hotMeter: clientHotMeter, sessionId } = await req.json();
    const currentHotMeter = clientHotMeter ?? arousalLevel ?? 0;
    
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

    // 1. Cek Advanced Edging (hot meter >= 65 + kata kunci)
    const isEdgingKeywords = ['tahan', 'pelanin', 'napas', 'breath', 'eye contact', 'tatap mata', 'bisik', 'whisper'].some(k => latestUserChoice.includes(k));
    if (currentHotMeter >= 65 && isEdgingKeywords) {
      injectedPrompt += '\n\n' + ADVANCED_EDGING_PROMPT;
    }

    // 2. Cek Scissoring (hot meter >= 65 + kata kunci khusus lesbian)
    const isScissoringKeywords = ['scissor', 'tribbing', 'gesek memek', 'saling gesek'].some(k => latestUserChoice.includes(k));
    if (currentHotMeter >= 65 && isScissoringKeywords && genderTarget === 'female_lesbian') {
      injectedPrompt += '\n\n' + SCISSORING_BLENDED_PROMPT;
    }

    // 3. Cek Blended Orgasm (hot meter >= 75 + stimulasi ganda)
    if (currentHotMeter >= 75) {
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
      console.error('JSON Parse Error. Raw content:', data.choices?.[0]?.message?.content);
      return NextResponse.json({ error: 'Format response AI tidak valid' }, { status: 500 });
    }

    const sceneText = parsed.scene_text || parsed.text || parsed.story || 'Teks cerita tidak dapat dimuat. Silakan pilih opsi lagi.';
    const choices = parsed.choices || [];
    const newHistoryEntry = { role: 'assistant', content };
    const updatedHistory = [...history, newHistoryEntry];
    
    // Support both old arousal_delta and new hot_delta field names
    const hotDelta = parsed.hot_delta ?? parsed.arousal_delta ?? 0;
    const newHotMeter = Math.max(0, Math.min(100, currentHotMeter + hotDelta));
    const newStatus = parsed.status ?? 'ongoing';
    const partNumber = parsed.part_number ?? 1;
    const eduLesson = parsed.edu_lesson ?? null;
    const badEndReason = parsed.bad_end_reason ?? null;

    // Update sesi di Supabase jika sessionId ada
    if (sessionId) {
      const updatePayload: Record<string, unknown> = {
        history: updatedHistory,
        arousal_level: newHotMeter,
        current_text: sceneText,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      // Save extra fields if columns exist (graceful degradation)
      if (partNumber) updatePayload.current_part = partNumber;
      if (badEndReason) updatePayload.bad_end_reason = badEndReason;
      
      const { error: updateError } = await supabaseServer
        .from('story_sessions')
        .update(updatePayload)
        .eq('id', sessionId);

      if (updateError) {
        console.error('Supabase update error:', updateError);
      }
    }

    return NextResponse.json({
      sceneText: sceneText,
      hotDelta: hotDelta,
      arousalDelta: hotDelta, // backward compat
      choices: choices,
      status: newStatus,
      partNumber: partNumber,
      eduLesson: eduLesson,
      educationTip: parsed.education_tip ?? null,
      badEndReason: badEndReason,
      newHistoryEntry,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
