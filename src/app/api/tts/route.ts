// src/app/api/tts/route.ts
// Server-side proxy ke EdgeTTS lokal — menyembunyikan API key dari client

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { text, voice } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ttsBase = process.env.TTS_EDGE_BASE_URL || 'http://localhost:5050';
    const ttsKey  = process.env.TTS_EDGE_API_KEY  || '';
    const ttsVoice = voice || 'id-ID-ArdiNeural'; // Suara Indonesia default

    const res = await fetch(`${ttsBase}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ttsKey ? { 'Authorization': `Bearer ${ttsKey}` } : {}),
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.slice(0, 1000), // Batasi 1000 karakter
        voice: ttsVoice,
        response_format: 'mp3',
        speed: 1.0,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[tts] EdgeTTS error:', res.status, errText);
      return new Response(JSON.stringify({ error: `TTS error: ${res.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pipe audio langsung ke client
    const audioBuffer = await res.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (err: any) {
    // Jika EdgeTTS tidak jalan (ECONNREFUSED), return 503
    const isFetch = String(err?.message || '').includes('fetch failed') 
                 || String(err?.message || '').includes('ECONNREFUSED');
    console.error('[tts] Error:', err?.message || err);
    return new Response(JSON.stringify({
      error: isFetch
        ? 'TTS server tidak berjalan. Jalankan edge-tts-server/start.bat'
        : `TTS error: ${String(err?.message || err).slice(0, 200)}`
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
