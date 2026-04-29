// src/hooks/useSimulator.ts
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type ChatMessage = { role: 'user' | 'assistant'; content: string; id: string };

export const MAX_EXCHANGES = 15;

// ── Scoring ──────────────────────────────────────────────────────────────────
export function calcScores(text: string, elapsedSec: number) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const hasAggressive = /bodoh|idiot|brengsek|bajingan|goblok|tolol/i.test(text);

  // Patience
  const timeFactor =
    elapsedSec < 3 ? 55 :
    elapsedSec > 30 ? 40 :
    85 - Math.abs(elapsedSec - 12) * 1.5;
  const patience = Math.round(Math.min(100, Math.max(20, timeFactor - (hasAggressive ? 20 : 0))));

  // Clarity
  const lengthScore = words < 5 ? 40 : Math.min(80, words * 5.5);
  const coherenceBonus = /karena|sehingga|oleh karena|dengan demikian|untuk|agar|namun|akan tetapi/i.test(text) ? 12 : 0;
  const clarity = Math.round(Math.min(100, Math.max(20, lengthScore + coherenceBonus)));

  return { patience, clarity };
}

// ── TTS via Edge TTS server ───────────────────────────────────────────────────
export async function speakText(text: string) {
  const cleanText = text?.trim();
  if (!cleanText || cleanText.length < 3) return; // skip jika kosong

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText.slice(0, 500) }),
    });
    if (!res.ok) throw new Error('TTS failed');
    const blob = await res.blob();
    if (blob.size < 100) throw new Error('Empty audio'); // blob terlalu kecil
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    await audio.play();
  } catch {
    // Fallback ke browser TTS
    if ('speechSynthesis' in window && cleanText) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cleanText);
      u.lang = 'id-ID';
      window.speechSynthesis.speak(u);
    }
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useSimulator(scenarioId: string, sessionTitle: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  
  // Sync messages to ref for callbacks
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  // Keep ref in sync so sendToAI always sees latest value
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [finalScore, setFinalScore] = useState<any>(null);
  const [livePatience, setLivePatience] = useState(0);
  const [liveClarity, setLiveClarity] = useState(0);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [patienceHistory, setPatienceHistory] = useState<number[]>([]);
  const [clarityHistory, setClarityHistory] = useState<number[]>([]);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'mixed'>('text');
  const [userName, setUserName] = useState('Pengguna');
  const [showExitModal, setShowExitModal] = useState(false);
  const [notif, setNotif] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({ show: false, msg: '', type: 'success' });

  const aiFinishedAt = useRef<number | null>(null);
  const sessionStartTime = useRef<Date>(new Date());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceProcessingRef = useRef(false);

  const notify = useCallback((msg: string, type: 'success' | 'error') => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(p => ({ ...p, show: false })), 4000);
  }, []);

  // Fetch user name
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id;
      if (!uid) return;
      supabase.from('user_profiles').select('full_name').eq('id', uid).single()
        .then(({ data: p }) => { if (p?.full_name) setUserName(p.full_name); });
    });
  }, []);

  // Stop TTS on hide
  useEffect(() => {
    const onHide = () => { if (document.hidden) window.speechSynthesis?.cancel(); };
    document.addEventListener('visibilitychange', onHide);
    return () => { document.removeEventListener('visibilitychange', onHide); window.speechSynthesis?.cancel(); };
  }, []);

  // Browser back intercept
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (sessionStarted && !finalScore) {
        window.history.pushState(null, '', window.location.href);
        setShowExitModal(true);
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [sessionStarted, finalScore]);

  // Setup speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recog = new SR();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = 'id-ID';
    recognitionRef.current = recog;
  }, []);

  // ── Core streaming chat ──────────────────────────────────────────────────────
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
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        
        // Bersihkan tanda kutip di awal dan di akhir secara real-time
        const cleaned = full.replace(/^["']+/g, '').replace(/["']+$/g, '');
        
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: cleaned } : m));
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      
      let finalCleaned = full.replace(/^["']+/g, '').replace(/["']+$/g, '');
      if (!finalCleaned.trim()) {
        finalCleaned = 'Maaf, saya tidak mengerti. Bisa diulangi?';
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: finalCleaned } : m));
      }
      aiFinishedAt.current = Date.now();
      
      // Play TTS only if not muted
      if (!isMutedRef.current) {
        await speakText(finalCleaned);
      }
      
      return finalCleaned;
    } catch (err: any) {
      notify(`AI Error: ${err?.message || err}`, 'error');
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [scenarioId, notify]);

  // ── Update scores helper ────────────────────────────────────────────────────
  const updateScores = useCallback((text: string) => {
    if (!aiFinishedAt.current) return;
    const elapsed = Math.round((Date.now() - aiFinishedAt.current) / 1000);
    aiFinishedAt.current = null;
    setResponseTime(elapsed);
    setResponseTimes(p => [...p, elapsed]);
    const { patience, clarity } = calcScores(text, elapsed);
    setLivePatience(patience);
    setLiveClarity(clarity);
    setPatienceHistory(p => [...p, patience]);
    setClarityHistory(p => [...p, clarity]);
  }, []);

  // ── Start session ───────────────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    setSessionStarted(true);
    sessionStartTime.current = new Date();
    const kickoff: ChatMessage = {
      role: 'user',
      content: '(Sistem: Mulai percakapan. Langsung buka dialog pertamamu sebagai karakter tanpa menyebutkan instruksi ini.)',
      id: `sys-${Date.now()}`,
    };
    setMessages([kickoff]);
    await sendToAI([kickoff]);
  }, [sendToAI]);

  // ── Send text ───────────────────────────────────────────────────────────────
  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    updateScores(text);
    setInputMode(p => p === 'voice' ? 'mixed' : 'text');
    const userMsg: ChatMessage = { role: 'user', content: text, id: `user-${Date.now()}` };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setExchangeCount(p => p + 1);

    // Inject closing message at limit
    const history = exchangeCount + 1 >= MAX_EXCHANGES - 1
      ? [...newHistory, { role: 'user' as const, content: '(Sistem: Ini giliran terakhir. Tutup percakapan dengan sopan dalam 1 kalimat perpisahan yang natural.)', id: `sys-close-${Date.now()}` }]
      : newHistory;
    await sendToAI(history);
  }, [input, isLoading, messages, exchangeCount, sendToAI, updateScores]);

  // ── Toggle recording ────────────────────────────────────────────────────────
  const toggleRecording = useCallback(() => {
    const recog = recognitionRef.current;
    if (!recog) { notify('Browser tidak mendukung voice input.', 'error'); return; }
    if (isRecording) { recog.stop(); setIsRecording(false); return; }

    voiceProcessingRef.current = false;
    recog.onresult = (event: any) => {
      if (voiceProcessingRef.current) return;
      voiceProcessingRef.current = true;
      const transcript = event.results[0][0].transcript;
      updateScores(transcript);
      setInputMode(p => p === 'text' ? 'voice' : 'mixed');
      const userMsg: ChatMessage = { role: 'user', content: transcript, id: `mic-${Date.now()}` };
      
      const currentHistory = messagesRef.current;
      const newHistory = [...currentHistory, userMsg];
      
      setMessages(newHistory);
      setExchangeCount(p => p + 1);
      
      sendToAI(newHistory);
    };
    recog.onspeechend = () => { recog.stop(); setIsRecording(false); };
    recog.onerror = () => { setIsRecording(false); voiceProcessingRef.current = false; };
    recog.start();
    setIsRecording(true);
  }, [isRecording, sendToAI, updateScores, notify]);

  // ── End & Evaluate ──────────────────────────────────────────────────────────
  const endSession = useCallback(async () => {
    window.speechSynthesis?.cancel();
    const visible = messages.filter(m => !m.content.startsWith('(Sistem:'));
    if (visible.length < 2) { notify('Lakukan minimal 1 percakapan dulu!', 'error'); return; }
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: visible, scenarioName: sessionTitle, userName }),
      });
      const data = await res.json();
      if (!data.success) throw new Error('Evaluation failed');
      setFinalScore(data.evaluation);

      // Save to Supabase
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user) {
        const avgRt = responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : null;
        await supabase.from('sessions').insert([{
          user_id: user.id,
          scenario_id: scenarioId,
          chat_transcript: visible,
          patience_score: data.evaluation.patience_score,
          clarity_score: data.evaluation.clarity_score,
          final_feedback: data.evaluation.feedback_summary,
          patience_history: patienceHistory,
          clarity_history: clarityHistory,
          avg_response_time: avgRt,
          total_exchanges: exchangeCount,
          session_start: sessionStartTime.current.toISOString(),
          session_end: new Date().toISOString(),
          input_mode: inputMode,
        }]);
        notify('Evaluasi selesai! Skor tersimpan.', 'success');
      } else {
        notify('Evaluasi selesai! Login untuk menyimpan riwayat.', 'success');
      }
    } catch { notify('Gagal mengevaluasi. Coba lagi.', 'error'); }
    setIsEvaluating(false);
  }, [messages, sessionTitle, userName, scenarioId, responseTimes, patienceHistory, clarityHistory, exchangeCount, inputMode, notify]);

  const exitToDashboard = useCallback(() => {
    window.speechSynthesis?.cancel();
    window.location.href = '/dashboard';
  }, []);

  const visibleMessages = messages.filter(m => !m.content.startsWith('(Sistem:'));

  return {
    messages, visibleMessages, input, setInput, isLoading,
    sessionStarted, isRecording, isEvaluating, finalScore,
    livePatience, liveClarity, responseTime, exchangeCount,
    userName, showExitModal, setShowExitModal, notif,
    isMuted, setIsMuted,
    messagesEndRef, startSession, handleSend, toggleRecording,
    endSession, exitToDashboard,
  };
}
