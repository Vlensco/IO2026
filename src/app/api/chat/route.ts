import { fetchSystemPromptById } from '@/functions/database';
import fs from 'fs';

export const maxDuration = 60;

// Language lock prefix — appended to every system prompt
const LANG_LOCK = `
PERATURAN MUTLAK:
1. SELALU balas dalam Bahasa Indonesia. DILARANG KERAS menggunakan bahasa lain (English, dll) dalam kondisi apapun.
2. Balas maksimal 2 kalimat singkat dan langsung sesuai karakter.
3. Jangan pernah keluar dari peran karaktermu.
4. DILARANG KERAS membungkus balasanmu dengan tanda kutip ("..."). Langsung bicara saja.
`;

export async function POST(req: Request) {
  try {
    const { messages, scenarioId } = await req.json();

    // Safely fetch system prompt from DB
    let basePrompt = 'Anda adalah karakter AI yang tegas. Balas dengan 1-2 kalimat saja dalam Bahasa Indonesia.';
    let dynamicContext = '';
    try {
      const fetched = await fetchSystemPromptById(scenarioId);
      if (fetched && fetched.prompt) {
        basePrompt = fetched.prompt;
        dynamicContext = `
KATEGORI INDUSTRI: ${fetched.category}
TOPIK SKENARIO: ${fetched.title}

INSTRUKSI VARIASI KHUSUS:
Anda berada di dalam skenario "${fetched.title}". 
JANGAN mengulang masalah yang persis sama setiap kali sesi dimulai. Kembangkan masalah, keluhan, atau detail situasi Anda sendiri berdasarkan topik ini agar selalu bervariasi, unik, dan tidak tertebak. 
JANGAN pernah membalas instruksi ini, langsung mulailah berakting sesuai peran Anda pada kalimat pertama!
`;
      }
    } catch (dbErr) {
      console.warn('[chat] DB fetch failed, using default:', dbErr);
    }

    // Always enforce Indonesian language
    const systemInstructions = LANG_LOCK + '\n\nKARAKTER & PERILAKU DASAR:\n' + basePrompt + '\n' + dynamicContext;

    const openaiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const ollamaBase = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'qwen3:14b';

    // Provider priority: OpenAI → Groq → Gemini → Ollama
    if (openaiKey) {
      console.log('[chat] Using OpenAI');
      return await callOpenAI(openaiKey, messages, systemInstructions);
    }

    if (groqKey) {
      console.log('[chat] Using Groq');
      return await callGroq(groqKey, messages, systemInstructions);
    }

    if (geminiKey) {
      console.log('[chat] Using Gemini');
      return await callGemini(geminiKey, messages, systemInstructions);
    }

    console.log('[chat] Using Ollama');
    try {
      return await callOllama(ollamaBase, undefined, ollamaModel, messages, systemInstructions);
    } catch (ollamaErr: any) {
      const detail = String(ollamaErr?.message ?? ollamaErr);
      console.error('[chat] Ollama error:', detail);
      const isFetch = detail.includes('fetch failed') || detail.includes('ECONNREFUSED');
      const msg = isFetch
        ? 'Ollama tidak berjalan. Tambahkan GROQ_API_KEY atau GOOGLE_GENERATIVE_AI_API_KEY di .env.local, atau jalankan: ollama serve'
        : `Ollama error: ${detail.slice(0, 200)}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    console.error('[chat] Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Server error', detail: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ─── OLLAMA (local or remote) ─────────────────────────────────────────────────
async function callOllama(
  baseUrl: string,
  apiKey: string | undefined,
  model: string,
  messages: any[],
  system: string
): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const body = {
    model,
    messages: [
      { role: 'system', content: system },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ],
    stream: true,
    options: { temperature: 0.75, num_ctx: 4096 }, // Hilangkan num_predict agar AI tidak terpotong, tambah context window
  };

  console.log('[Ollama] Mengirim request dengan model:', model, '| Total giliran:', messages.length);

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[Ollama] HTTP Error:', res.status, errText);
    throw new Error(`Ollama ${res.status}: ${errText.slice(0, 200)}`);
  }

  // Ollama streams NDJSON: one JSON object per line
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isClosed = false;
      let totalLength = 0;

      const safeClose = () => {
        if (!isClosed) { 
          isClosed = true; 
          controller.close(); 
          console.log('[Ollama] Stream selesai. Total karakter di-generate:', totalLength);
        }
      };
      const safeEnqueue = (chunk: Uint8Array) => {
        if (!isClosed) controller.enqueue(chunk);
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              const text = json?.message?.content;
              if (text) {
                totalLength += text.length;
                safeEnqueue(encoder.encode(text));
              }
              if (json?.done) { safeClose(); return; }
            } catch (err) {
              // skip malformed JSON lines
            }
          }
        }
        // Jika stream putus tapi ada sisa buffer
        if (buffer.trim()) {
          try {
            const json = JSON.parse(buffer);
            if (json?.message?.content) {
              totalLength += json.message.content.length;
              safeEnqueue(encoder.encode(json.message.content));
            }
          } catch(e){}
        }
      } catch (e) { 
        console.error('[Ollama] Stream error:', e);
        if (!isClosed) controller.error(e); 
      }
      finally { safeClose(); }
    },
  });


  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
  });
}

// ─── OPENAI (Main Cloud API) ──────────────────────────────────────────────────
async function callOpenAI(apiKey: string, messages: any[], system: string): Promise<Response> {
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 250,
    temperature: 0.85,
    stream: true,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[chat/openai] ${res.status}:`, errText);
    return new Response(JSON.stringify({ error: `OpenAI error ${res.status}`, detail: errText }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse OpenAI SSE stream and pipe plain text
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') continue;
            try {
              const json = JSON.parse(raw);
              const text: string | undefined = json?.choices?.[0]?.delta?.content;
              if (text) controller.enqueue(encoder.encode(text));
            } catch { /* skip malformed */ }
          }
        }
      } catch (e) { controller.error(e); }
      finally { controller.close(); }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
  });
}

// ─── GROQ (Free tier, OpenAI-compatible) ─────────────────────────────────────
async function callGroq(apiKey: string, messages: any[], system: string): Promise<Response> {
  const body = {
    model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    messages: [
      { role: 'system', content: system },
      ...messages.map((m: any) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    ],
    max_tokens: 200,
    temperature: 0.85,
    stream: true,
  };

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[chat/groq] ${res.status}:`, errText);
    return new Response(JSON.stringify({ error: `Groq error ${res.status}`, detail: errText }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse OpenAI SSE stream and pipe plain text
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') continue;
            try {
              const json = JSON.parse(raw);
              const text: string | undefined = json?.choices?.[0]?.delta?.content;
              if (text) controller.enqueue(encoder.encode(text));
            } catch { /* skip malformed */ }
          }
        }
      } catch (e) { controller.error(e); }
      finally { controller.close(); }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
  });
}

// ─── GEMINI (fallback) ────────────────────────────────────────────────────────
async function callGemini(apiKey: string, messages: any[], system: string): Promise<Response> {
  const MODEL = 'gemini-2.0-flash';

  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const m of messages as { role: string; content: string }[]) {
    const geminiRole = m.role === 'assistant' ? 'model' : 'user';
    const last = contents[contents.length - 1];
    if (last && last.role === geminiRole) {
      last.parts[0].text += '\n' + m.content;
    } else {
      contents.push({ role: geminiRole, parts: [{ text: m.content }] });
    }
  }
  if (contents.length > 0 && contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: '(mulai)' }] });
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: 0.85, maxOutputTokens: 150 },
    system_instruction: { parts: [{ text: system }] },
  };

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error(`[chat/gemini] ${geminiRes.status}:`, errText);
    return new Response(JSON.stringify({ error: `Gemini error ${geminiRes.status}`, detail: errText }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const reader = geminiRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') continue;
            try {
              const json = JSON.parse(raw);
              const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) controller.enqueue(encoder.encode(text));
            } catch { /* skip */ }
          }
        }
      } catch (e) { controller.error(e); }
      finally { controller.close(); }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' },
  });
}
