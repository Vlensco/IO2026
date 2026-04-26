"""
Simulacra EdgeTTS Server — Python (Tanpa Docker)
Kompatibel dengan OpenAI /v1/audio/speech endpoint
Jalankan: python server.py
"""

import asyncio
import io
import os
from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import edge_tts
import uvicorn

# ── Config ──────────────────────────────────────────────────────────────────
API_KEY      = os.getenv("EDGE_TTS_API_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI0YzczZWQ0Ny01NTE0LTRmYzUtYjhiNS1jY2YzNjI4YWNmMTIiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc3NzA5MzgyMSwiZXhwIjoxOTM0ODgxODIxfQ.NCfHfdgqbQGqWSbG24g3DhsEahUymdLJFK42lWrDQAg")
PORT         = int(os.getenv("PORT", 5050))
DEFAULT_VOICE = os.getenv("DEFAULT_VOICE", "id-ID-GadisNeural")
REQUIRE_KEY  = True

# ── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(title="Simulacra EdgeTTS Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    model: Optional[str] = "tts-1"
    input: str
    voice: Optional[str] = None
    response_format: Optional[str] = "mp3"
    speed: Optional[float] = 1.0

# ── Auth helper ──────────────────────────────────────────────────────────────
def verify_key(authorization: Optional[str] = None):
    if not REQUIRE_KEY:
        return
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing API key")
    token = authorization.removeprefix("Bearer ").strip()
    if token != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "Simulacra EdgeTTS", "voice": DEFAULT_VOICE}

@app.get("/health")
def health():
    return {"status": "healthy"}

# ── /v1/audio/speech — OpenAI compatible ─────────────────────────────────────
@app.post("/v1/audio/speech")
async def text_to_speech(body: TTSRequest, authorization: Optional[str] = Header(default=None)):
    verify_key(authorization)

    text = body.input.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Input text is required")
    if len(text) > 4096:
        text = text[:4096]

    # Pilih voice
    voice = body.voice or DEFAULT_VOICE

    try:
        # Generate audio menggunakan edge-tts
        communicate = edge_tts.Communicate(text, voice)
        audio_buffer = io.BytesIO()

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])

        audio_buffer.seek(0)

        if audio_buffer.getbuffer().nbytes == 0:
            raise HTTPException(status_code=500, detail="No audio generated")

        return StreamingResponse(
            audio_buffer,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"}
        )

    except edge_tts.exceptions.NoAudioReceived:
        raise HTTPException(status_code=500, detail="Edge TTS: No audio received. Check voice name.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

# ── List available voices ─────────────────────────────────────────────────────
@app.get("/v1/voices")
async def list_voices():
    voices = await edge_tts.list_voices()
    id_voices = [v for v in voices if "id-ID" in v.get("ShortName", "")]
    return {"voices": id_voices, "default": DEFAULT_VOICE}

# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 50)
    print("  Simulacra EdgeTTS Server")
    print(f"  Running at: http://localhost:{PORT}")
    print(f"  Default voice: {DEFAULT_VOICE}")
    print(f"  Endpoint: POST /v1/audio/speech")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
