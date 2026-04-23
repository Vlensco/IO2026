import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, scenarioName, userName } = await req.json();

    const systemPrompt = `
      Anda adalah seorang Ahli HRD dan Evaluator Komunikasi (Asesor).
      Berikut adalah transkrip obrolan antara Pelanggan dan Agen CS (${userName}).
      Skenario: ${scenarioName}.
      Beri nilai kesabaran (patience_score) dan kejelasan bahasa (clarity_score) dari skala 1-100 berdasarkan respon dari Agen CS (${userName}).
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

    return new Response(JSON.stringify({ success: true, evaluation: result.object }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Evaluation Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to evaluate session' }), { status: 500 });
  }
}
