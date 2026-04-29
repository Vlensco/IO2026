import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

// Buat instance provider yang mengarah ke Ollama lokal (kompatibel dengan OpenAI)
const ollamaProvider = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ? `${process.env.OLLAMA_BASE_URL}/v1` : 'http://localhost:11434/v1',
  apiKey: 'ollama', // Key sembarang untuk local
});

export async function POST(req: Request) {
  try {
    const { messages, scenarioName, userName } = await req.json();

    const systemPrompt = `Anda adalah seorang Ahli HRD dan Evaluator Komunikasi (Asesor).
TUGAS UTAMA: Evaluasi percakapan berikut dan WAJIB 100% menggunakan BAHASA INDONESIA.
DILARANG KERAS menggunakan bahasa Inggris (DO NOT USE ENGLISH).

Skenario: ${scenarioName}
Nama Agen CS: ${userName}

Berikan nilai kesabaran (patience_score) dan kejelasan bahasa (clarity_score) dari skala 1-100.
Tuliskan 'feedback_summary' yang berisi 1-3 kalimat evaluasi performa CS. INGAT: Isi dari feedback_summary INI HARUS DALAM BAHASA INDONESIA, misalnya: "CS sudah cukup baik dalam merespon, namun masih kurang ramah saat menjelaskan solusi teknis."`;

    const modelName = process.env.OLLAMA_MODEL || 'deepseek-r1:1.5b';

    // Kita menyuruh AI membuat format JSON
    const result = await generateObject({
      model: ollamaProvider(modelName),
      system: systemPrompt,
      prompt: "INSTRUKSI: Tulis seluruh hasil evaluasi dalam BAHASA INDONESIA. Jangan ada satupun kata bahasa Inggris.\n\nTranskrip: " + JSON.stringify(messages),
      schema: z.object({
        patience_score: z.number().describe('Nilai kesabaran dari skala 1-100'),
        clarity_score: z.number().describe('Nilai kejelasan bahasa dari skala 1-100'),
        feedback_summary: z.string().describe('Tulis 1-3 kalimat ringkasan evaluasi dalam BAHASA INDONESIA yang baku.')
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
