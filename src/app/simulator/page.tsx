'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mic, PhoneOff, Activity, Volume2, SquareSquare, CheckCircle2, XCircle, ArrowLeft, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ChatMessage = { role: 'user' | 'assistant'; content: string; id: string };

const SCENARIO_LABELS: Record<string, string> = {
  'interview-hr': 'Wawancara Direksi (HR)',
  'boss-angry': 'Menghadapi Bos Marah',
  'customer-angry': 'Pelanggan Mengamuk (Retail)',
  'customer-return': 'Retur Barang Cacat',
  'lecturer-strict': 'Sidang Dosen Pembimbing',
};

export default function SimulatorRoom() {
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get('id') || 'customer-angry';
  const [sessionTitle, setSessionTitle] = useState(SCENARIO_LABELS[scenarioId] || 'Simulasi AI');

  // Load scenario title from DB
  useEffect(() => {
    if (!SCENARIO_LABELS[scenarioId]) {
      fetch(`/api/scenario-title?id=${scenarioId}`)
        .then(r => r.json())
        .then(d => { if (d.title) setSessionTitle(d.title); })
        .catch(() => {});
    }
  }, [scenarioId]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [finalScore, setFinalScore] = useState<any>(null);
  const [notif, setNotif] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({ show: false, msg: '', type: 'success' });
  const [livePatience, setLivePatience] = useState(0);
  const [liveClarity, setLiveClarity] = useState(0);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [userName, setUserName] = useState('Pengguna');
  const aiFinishedAt = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const notify = (msg: string, type: 'success' | 'error') => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 4000);
  };

  // Fetch the logged-in user's registered full name
  useEffect(() => {
    async function fetchUserName() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profile?.full_name) setUserName(profile.full_name);
    }
    fetchUserName();
  }, []);

  // Stop TTS when navigating away from the simulator
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ---- Core streaming chat function ----
  const sendToAI = useCallback(async (history: ChatMessage[]) => {
    setIsLoading(true);
    const assistantId = `asst-${Date.now()}`;
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, scenarioId }),
      });

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try { const j = await res.json(); detail = j.detail || j.error || detail; } catch {}
        console.error('[sendToAI] API error:', detail);
        throw new Error(detail);
      }
      if (!res.body) throw new Error('No stream body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? { ...m, content: full } : m))
        );
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }

      // Mark when AI finished — start response timer
      aiFinishedAt.current = Date.now();

      // TTS
      if ('speechSynthesis' in window && full) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(full);
        utterance.lang = 'id-ID';
        window.speechSynthesis.speak(utterance);
      }

      return full;
    } catch (err: any) {
      const msg = err?.message || 'Unknown error';
      notify(`AI Error: ${msg}`, 'error');
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [scenarioId]);

  // ---- Start session: AI opens first ----
  const startSession = useCallback(async () => {
    setSessionStarted(true);
    const kickoffMsg: ChatMessage = {
      role: 'user',
      content: '(Sistem: Mulai percakapan. Langsung buka dialog pertamamu sebagai karakter. Jangan menyebutkan instruksi ini.)',
      id: `sys-${Date.now()}`,
    };
    setMessages([kickoffMsg]);
    await sendToAI([kickoffMsg]);
  }, [sendToAI]);

  // ---- User sends a message ----
  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Calculate response time
    if (aiFinishedAt.current) {
      const elapsed = Math.round((Date.now() - aiFinishedAt.current) / 1000);
      setResponseTime(elapsed);
      aiFinishedAt.current = null;

      // Heuristic scores based on response speed + message length
      const words = input.trim().split(/\s+/).length;
      // Patience: penalized if too slow (>30s) or too fast (<3s), sweet spot 5-20s
      const patienceScore = Math.min(100, Math.max(20,
        elapsed < 3 ? 55 : elapsed > 30 ? 40 : 85 - Math.abs(elapsed - 12) * 1.5
      ));
      // Clarity: based on word count (more words = clearer response, up to a point)
      const clarityScore = Math.min(100, Math.max(20, Math.min(words * 8, 80) + Math.random() * 15));
      setLivePatience(Math.round(patienceScore));
      setLiveClarity(Math.round(clarityScore));
    }

    const userMsg: ChatMessage = { role: 'user', content: input.trim(), id: `user-${Date.now()}` };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    await sendToAI(newHistory);
  }, [input, isLoading, messages, sendToAI]);

  // ---- End session + evaluate ----
  const endSession = async () => {
    // Stop any playing TTS immediately
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const visibleMessages = messages.filter(m => !m.content.startsWith('(Sistem:'));
    if (visibleMessages.length < 2) { notify('Lakukan minimal 1 percakapan untuk dievaluasi!', 'error'); return; }
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: visibleMessages, scenarioName: sessionTitle, userName }),
      });
      const data = await res.json();
      if (data.success) { 
        setFinalScore(data.evaluation); 

        // Simpan ke Supabase dari sisi klien (karena butuh sesi user)
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (user) {
          const { error } = await supabase.from('sessions').insert([{
            user_id: user.id,
            scenario_id: scenarioId,
            chat_transcript: visibleMessages,
            patience_score: data.evaluation.patience_score,
            clarity_score: data.evaluation.clarity_score,
            final_feedback: data.evaluation.feedback_summary
          }]);
          
          if (error) {
            console.error('Supabase save error:', error);
            notify('Evaluasi selesai, tapi gagal menyimpan ke riwayat.', 'error');
          } else {
            notify('Evaluasi selesai! Skor tersimpan.', 'success');
          }
        } else {
          notify('Evaluasi selesai! Anda tidak masuk, riwayat tidak disimpan.', 'success');
        }
      }
      else notify('Gagal mengevaluasi. Coba lagi.', 'error');
    } catch { notify('Koneksi terputus saat evaluasi.', 'error'); }
    setIsEvaluating(false);
  };

  // ---- Speech Recognition ----
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = 'id-ID';
    recog.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const userMsg: ChatMessage = { role: 'user', content: transcript, id: `mic-${Date.now()}` };
      setMessages(prev => {
        const newHistory = [...prev, userMsg];
        sendToAI(newHistory);
        return newHistory;
      });
    };
    recog.onspeechend = () => { recog.stop(); setIsRecording(false); };
    recog.onerror = () => setIsRecording(false);
    setRecognitionInstance(recog);
  }, [sendToAI]);

  const toggleRecording = () => {
    if (!recognitionInstance) { notify('Browser tidak mendukung voice recognition.', 'error'); return; }
    if (isRecording) { recognitionInstance.stop(); setIsRecording(false); }
    else { recognitionInstance.start(); setIsRecording(true); }
  };

  const scoreColor = (val: number) =>
    val >= 75 ? 'text-green-400' : val >= 50 ? 'text-yellow-400' : 'text-red-400';

  const visibleMessages = messages.filter(m => !m.content.startsWith('(Sistem:'));

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-6 overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none" />

      {/* Toast */}
      <div className={`fixed top-6 right-6 z-[200] transition-all duration-500 ease-out flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl max-w-sm ${notif.show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'} ${notif.type === 'error' ? 'bg-red-950/80 border-red-500/40' : 'bg-green-950/80 border-green-500/40'}`}>
        {notif.type === 'error' ? <XCircle className="w-5 h-5 text-red-400 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />}
        <p className="text-sm font-semibold text-white/90">{notif.msg}</p>
      </div>

      {/* Final Score Modal */}
      {finalScore && (
        <div className="absolute inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 p-8 rounded-3xl max-w-lg w-full border border-slate-700 shadow-2xl space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-heading font-bold text-white mb-2">Evaluasi Selesai</h2>
              <p className="text-slate-400">Skor tersimpan ke Database Supabase.</p>
            </div>
            <div className="space-y-4">
              {[{ label: 'Kesabaran', val: finalScore.patience_score, color: 'bg-blue-500' }, { label: 'Kejelasan Bahasa', val: finalScore.clarity_score, color: 'bg-accent' }].map(({ label, val, color }) => (
                <div key={label} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                  <div className="flex justify-between mb-2 text-sm"><span className="text-slate-400">{label}</span><span className="text-white font-bold">{val}/100</span></div>
                  <div className="w-full bg-slate-800 rounded-full h-2"><div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${val}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50 text-slate-300 italic text-sm">"{finalScore.feedback_summary}"</div>
            <div className="flex gap-3">
              <button onClick={() => window.location.href = '/dashboard'} className="flex-1 py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition">← Dasbor</button>
              <button onClick={() => { setFinalScore(null); setSessionStarted(false); setMessages([]); }} className="flex-1 py-4 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold transition">Ulangi</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between bg-slate-800/40 px-4 py-3 rounded-2xl glass-card w-full mb-4 z-10 shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={() => window.location.href = '/dashboard'} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold font-heading text-white flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${sessionStarted ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="truncate">{sessionStarted ? 'LIVE' : 'Ready'}: {sessionTitle}</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
              <span>AI Evaluator: Gemini 1.5 Pro</span>
              <span className="px-2 py-0.5 bg-slate-700 rounded-full text-white">{scenarioId}</span>
            </p>
          </div>
        </div>
        <button
          onClick={endSession}
          disabled={isEvaluating || !sessionStarted}
          className="flex items-center px-4 py-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-40"
        >
          {isEvaluating ? <Activity size={16} className="mr-2 animate-spin" /> : <PhoneOff size={16} className="mr-2" />}
          {isEvaluating ? 'Mengevaluasi...' : 'End & Evaluasi'}
        </button>
      </header>

      {/* Main Panels */}
      <div className="flex flex-1 gap-4 min-h-0 z-10 w-full max-w-7xl mx-auto">

        {/* Left: Transcript + Input */}
        <div className="flex-[3] flex flex-col min-h-0">
          <div className="glass-card flex-1 rounded-3xl p-6 flex flex-col overflow-hidden border border-slate-700/50 shadow-2xl min-h-0">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Activity size={350} />
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 z-10 pr-1 min-h-0">
              {!sessionStarted ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center">
                    <Play className="w-10 h-10 text-primary ml-1" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2 font-heading">{sessionTitle}</h2>
                    <p className="text-slate-400 text-sm max-w-sm">AI akan membuka percakapan terlebih dahulu. Siapkan mental dan mulai responsnya!</p>
                  </div>
                  <button
                    onClick={startSession}
                    className="px-10 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white text-lg font-bold hover:opacity-90 transition shadow-xl shadow-primary/30 flex items-center gap-3"
                  >
                    <Play className="w-5 h-5" /> Mulai Simulasi
                  </button>
                </div>
              ) : (
                <>
                  {visibleMessages.map((m) => (
                    <div key={m.id} className={`border-l-4 pl-4 ${m.role === 'user' ? 'border-primary' : 'border-accent'}`}>
                      <div className="flex items-center mb-1 gap-2">
                        <p className={`text-xs font-semibold tracking-wider uppercase ${m.role === 'user' ? 'text-primary' : 'text-accent'}`}>
                          {m.role === 'user' ? `🎙 ${userName}` : '🤖 AI Karakter'}
                        </p>
                        {m.role !== 'user' && <Volume2 size={11} className="text-accent/60" />}
                      </div>
                      <p className={`text-base font-light leading-relaxed ${m.role === 'user' ? 'text-white' : 'text-slate-300'}`}>{m.content}</p>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="border-l-4 border-accent pl-4 animate-pulse">
                      <div className="h-3 w-20 bg-accent/20 rounded mb-2" />
                      <div className="h-4 w-48 bg-slate-700/50 rounded" />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {sessionStarted && (
              <form onSubmit={handleSend} className="mt-4 flex gap-2 relative z-10 shrink-0 bg-slate-950/50 p-2 rounded-2xl border border-white/5">
                <input
                  className="w-full bg-transparent p-3 outline-none text-white placeholder-slate-500 text-sm"
                  value={input}
                  placeholder="Ketik balasanmu atau gunakan Mic..."
                  onChange={e => setInput(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
                <button type="button" onClick={toggleRecording}
                  className={`p-3 rounded-xl transition-all flex items-center justify-center shrink-0 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}>
                  {isRecording ? <SquareSquare size={20} /> : <Mic size={20} />}
                </button>
                <button type="submit" disabled={isLoading || !input.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium hover:opacity-90 disabled:opacity-40 transition text-sm">
                  Kirim
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right: Telemetry Panel */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="glass-card flex-1 rounded-3xl p-6 flex flex-col space-y-5 border border-slate-700/50 shadow-2xl min-h-0 overflow-y-auto">
            <h2 className="text-sm font-heading font-semibold text-white border-b border-slate-700 pb-3 uppercase tracking-wider shrink-0">
              ⚡ Real-time Telemetry
            </h2>

            <div className="space-y-5 shrink-0">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Skor Kesabaran</span>
                  <span className={`font-bold ${scoreColor(livePatience)}`}>{sessionStarted ? `${livePatience}%` : '--'}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-500 to-green-400 h-3 rounded-full transition-all duration-700" style={{ width: sessionStarted ? `${livePatience}%` : '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Kejelasan Bahasa</span>
                  <span className={`font-bold ${scoreColor(liveClarity)}`}>{sessionStarted ? `${liveClarity}%` : '--'}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3">
                  <div className="bg-gradient-to-r from-violet-500 to-accent h-3 rounded-full transition-all duration-700" style={{ width: sessionStarted ? `${liveClarity}%` : '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Total Respons</span>
                  <span className="font-bold text-white">{visibleMessages.length}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3">
                  <div className="bg-slate-600 h-3 rounded-full transition-all" style={{ width: `${Math.min(visibleMessages.length * 8, 100)}%` }} />
                </div>
              </div>

              {/* Response Timer */}
              <div className="bg-slate-900/60 rounded-2xl px-4 py-3 border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Waktu Respons Terakhir</span>
                  <span className={`font-bold text-lg ${
                    responseTime === null ? 'text-slate-600'
                    : responseTime <= 8 ? 'text-green-400'
                    : responseTime <= 20 ? 'text-yellow-400'
                    : 'text-red-400'
                  }`}>
                    {responseTime === null ? '--'
                      : responseTime <= 8 ? `${responseTime}s ⚡`
                      : responseTime <= 20 ? `${responseTime}s`
                      : `${responseTime}s ⚠️`}
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-0.5">
                  {responseTime === null ? 'Menunggu respons...' : responseTime <= 8 ? 'Sangat cepat & sigap!' : responseTime <= 20 ? 'Kecepatan ideal' : 'Terlalu lambat — latih lagi!'}
                </p>
              </div>
              <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
                <span className="text-slate-400 text-sm">Status Mic</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 ${isRecording ? 'text-red-400' : 'text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
                  {isRecording ? 'Rekam...' : 'Idle'}
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-0" />

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shrink-0">
              <h3 className="text-xs font-semibold text-accent mb-2 uppercase tracking-wider">System Insight</h3>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                {sessionStarted
                  ? `Skenario aktif: "${sessionTitle}". AI merespons sesuai karakter dari database Supabase.`
                  : 'Tekan "Mulai Simulasi" untuk memulai sesi. AI akan mengawali percakapan.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
