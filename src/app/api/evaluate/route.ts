import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { supabase } from '@/lib/supabase'; // Important: we'll run this on the server or proxy. Wait, we can just return JSON to client and let client save it, but doing it in server is safer.

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, scenarioName, userName } = await req.json();

    const systemPrompt = `
      Anda adalah seorang Ahli HRD dan Evaluator Komunikasi (Asesor).
      Berikut adalah transkrip obrolan antara Pelanggan dan Agen CS (User).
      Beri nilai kesabaran (patience_score) dan kejelasan bahasa (clarity_score) dari skala 1-100 berdasarkan respon dari Agen CS (User).
      Bersikaplah netral namun cukup ketat. Jika CS menjawab dengan pendek/kasar, nilainya harus kecil.
    `;

    // Kita menyuruh AI membuat format JSON
    const result = await generateObject({
      model: google('gemini-1.5-pro'),
      system: systemPrompt,
      prompt: "Transkrip: " + JSON.stringify(messages),
      schema: z.object({
        patience_score: z.number().describe('Nilai kesabaran dari skala 1-100'),
        clarity_score: z.number().describe('Nilai kejelasan bahasa dari skala 1-100'),
        feedback_summary: z.string().describe('1 kalimat evaluasi singkat tentang performa user')
      }),
    });

    // Sesudah AI kasih nilai, kita simpan ke Supabase!
    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          user_name: userName,
          scenario_name: scenarioName,
          chat_transcript: messages,
          patience_score: result.object.patience_score,
          clarity_score: result.object.clarity_score
        }
      ]);

    if (error) {
      console.error("Supabase Error:", error);
      throw new Error("Failed to save to database");
    }

    return new Response(JSON.stringify({ success: true, evaluation: result.object }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Evaluation Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to evaluate session' }), { status: 500 });
  }
}
