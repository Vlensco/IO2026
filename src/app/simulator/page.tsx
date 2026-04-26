'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mic, PhoneOff, Activity, Volume2, VolumeX, Square, CheckCircle2,
  XCircle, ArrowLeft, Play, Info, AlertTriangle, BookOpen, User,
  Video, VideoOff, Settings, MicOff, MoreVertical, RefreshCcw, Home
} from 'lucide-react';
import { useSimulator, MAX_EXCHANGES } from '@/hooks/useSimulator';
import { supabase } from '@/lib/supabase';
import { useRef } from 'react';

const scoreColor = (v: number) =>
  v >= 75 ? 'text-secondary' : v >= 50 ? 'text-yellow-600' : 'text-error';
const scoreBarColor = (v: number) =>
  v >= 75 ? 'bg-secondary' : v >= 50 ? 'bg-yellow-500' : 'bg-error';

export default function SimulatorRoom() {
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get('id') || '';
  const [sessionTitle, setSessionTitle] = useState('Memuat skenario...');
  const [categoryName, setCategoryName] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle Webcam Feed
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isVideoOn && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.warn("Webcam access denied or unavailable", err);
          setIsVideoOn(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isVideoOn]);

  // Fetch judul skenario dari DB
  useEffect(() => {
    if (!scenarioId) { setSessionTitle('Skenario Tidak Ditemukan'); return; }
    supabase
      .from('scenarios')
      .select('title, categories(title)')
      .eq('id', scenarioId)
      .single()
      .then(({ data }) => {
        if (data) {
          setSessionTitle(data.title);
          setCategoryName((data.categories as any)?.title || '');
        } else {
          setSessionTitle(scenarioId);
        }
      });
  }, [scenarioId]);

  const sim = useSimulator(scenarioId, sessionTitle);
  const turnsLeft = MAX_EXCHANGES - sim.exchangeCount;
  const isNearEnd = sim.exchangeCount >= MAX_EXCHANGES - 2;

  // Format MM:SS for mock timer
  const [timer, setTimer] = useState(0);
  useEffect(() => {
    if (!sim.sessionStarted) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [sim.sessionStarted]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-surface text-on-surface font-sans overflow-hidden">
      
      {/* Toast */}
      <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border bg-white transition-all duration-500 max-w-sm ${sim.notif.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'} ${sim.notif.type === 'error' ? 'border-error/20' : 'border-secondary/20'}`}>
        {sim.notif.type === 'error' ? <XCircle className="w-5 h-5 text-error shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />}
        <p className="text-sm font-semibold text-on-surface">{sim.notif.msg}</p>
      </div>

      {/* Exit Modal */}
      {sim.showExitModal && (
        <div className="fixed inset-0 z-[300] bg-inverse-surface/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-error-container flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-error" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-heading mb-2">Akhiri Simulasi?</h3>
              <p className="text-outline text-sm">Sesi ini tidak akan tersimpan jika Anda keluar sekarang.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => sim.setShowExitModal(false)}
                className="flex-1 py-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold transition text-sm">
                Batal
              </button>
              <button onClick={sim.exitToDashboard}
                className="flex-1 py-3 rounded-lg bg-error hover:bg-error/90 text-white font-semibold transition text-sm">
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Score Modal (Redesigned) */}
      {sim.finalScore && (
        <div className="fixed inset-0 z-[250] bg-inverse-surface/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-6 border-b border-surface-container pb-4">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-outline mb-1">Evaluasi Selesai</p>
                <h2 className="text-3xl font-bold font-heading text-on-surface">{sessionTitle}</h2>
              </div>
              <div className="bg-primary-container/20 text-primary px-4 py-2 rounded-lg text-center">
                <p className="text-xs font-semibold">Overall Efficacy</p>
                <p className="text-2xl font-bold">{Math.round((sim.finalScore.patience_score + sim.finalScore.clarity_score) / 2)}<span className="text-sm text-primary/70">/100</span></p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Kesabaran & Tone', val: sim.finalScore.patience_score, desc: 'Pengendalian emosi' },
                { label: 'Kejelasan & Pacing', val: sim.finalScore.clarity_score, desc: 'Struktur argumen' },
              ].map(({ label, val, desc }) => (
                <div key={label} className="bg-surface-container-lowest border border-surface-container p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{label}</p>
                      <p className="text-xs text-outline">{desc}</p>
                    </div>
                    <span className={`text-xl font-bold ${scoreColor(val)}`}>{val}%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-700 ${scoreBarColor(val)}`} style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/10 p-5 rounded-xl mb-6">
              <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                <Activity size={16} /> AI Executive Summary
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {sim.finalScore.feedback_summary}
              </p>
            </div>

            <div className="flex gap-3 justify-end mt-8">
              <button onClick={sim.exitToDashboard}
                className="px-6 py-3 rounded-lg border border-surface-container-highest hover:bg-surface-container text-on-surface font-bold transition text-sm flex items-center gap-2">
                <Home className="w-4 h-4" /> Beranda
              </button>
              <button onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition text-sm shadow-md flex items-center gap-2">
                <RefreshCcw className="w-4 h-4" /> Latih Ulang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-surface-container-lowest border-b border-surface-container z-10">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => sim.sessionStarted ? sim.setShowExitModal(true) : sim.exitToDashboard()}
            className="text-primary hover:text-primary/80 font-semibold text-xl shrink-0 flex items-center gap-2">
            <ArrowLeft className="w-6 h-6" /> Kembali
          </button>
          
          <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-surface-container">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-error/20 bg-error/5 text-error text-xs font-bold tracking-wide">
              <span className={`w-2 h-2 rounded-full ${sim.sessionStarted ? 'bg-error animate-pulse' : 'bg-error/50'}`} />
              {sim.sessionStarted ? 'LIVE SIMULATION' : 'READY'}
            </div>
            {sim.sessionStarted && (
              <span className="text-sm font-bold text-outline flex items-center gap-1.5">
                ⏱ {formatTime(timer)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={sim.endSession}
          disabled={sim.isEvaluating || !sim.sessionStarted}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition shrink-0 ${
            isNearEnd && sim.sessionStarted
              ? 'bg-error text-white shadow-lg animate-pulse'
              : 'bg-error text-white hover:bg-error/90 shadow-sm'
          } disabled:opacity-40 disabled:cursor-not-allowed`}>
          {sim.isEvaluating
            ? <><Activity size={16} className="animate-spin" /> Analyzing...</>
            : <><PhoneOff size={16} /> End Simulation</>}
        </button>
      </header>

      {/* ── BODY SPLIT PANE ───────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 p-4 md:p-6 gap-6 max-w-7xl mx-auto w-full">

        {/* LEFT: Video Feed & Controls */}
        <div className="hidden md:flex flex-col flex-1 min-h-0 relative rounded-2xl overflow-hidden bg-surface-container shadow-inner border border-surface-container-highest">
          
          {/* Video Feed */}
          {isVideoOn ? (
            <div className="absolute inset-0 bg-surface-container-lowest flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform -scale-x-100" 
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-inverse-surface flex items-center justify-center flex-col">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden bg-primary/10 border-4 border-surface-container shadow-2xl flex items-center justify-center mb-4">
                <img 
                  src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${sessionTitle.replace(/\s+/g, '') || 'Simulacra'}&backgroundColor=0f172a`} 
                  alt="AI Persona Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-surface-container font-semibold tracking-wider uppercase text-sm">AI Voice Mode Active</p>
            </div>
          )}

          {/* Behavioral Analysis Overlay */}
          {sim.sessionStarted && (
            <div className="absolute top-6 left-6 glass bg-surface-container-lowest/80 p-4 rounded-xl shadow-lg border border-outline-variant/50 w-64 backdrop-blur-xl">
              <h3 className="text-xs font-bold text-primary mb-4 flex items-center gap-2">
                <Activity size={14} /> BEHAVIORAL ANALYSIS
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-outline">Pacing</span>
                    <span className={scoreColor(sim.liveClarity)}>{sim.liveClarity >= 75 ? 'Optimal' : sim.liveClarity >= 50 ? 'Fair' : 'Poor'}</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-1">
                    <div className={`${scoreBarColor(sim.liveClarity)} h-1 rounded-full transition-all duration-700`} style={{ width: `${sim.liveClarity}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-outline">Vocal Tone</span>
                    <span className={scoreColor(sim.livePatience)}>{sim.livePatience >= 75 ? 'Confident' : sim.livePatience >= 50 ? 'Steady' : 'Anxious'}</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-1">
                    <div className={`${scoreBarColor(sim.livePatience)} h-1 rounded-full transition-all duration-700`} style={{ width: `${sim.livePatience}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Controls Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
            {/* Status indicator */}
            <div className="glass bg-surface-container-lowest/90 px-4 py-2.5 rounded-lg shadow-sm border border-outline-variant/50 flex items-center gap-3">
              {sim.isRecording ? (
                <><Mic size={18} className="text-primary animate-pulse" /> <span className="text-sm font-bold text-primary uppercase">Listening</span></>
              ) : (
                <><MicOff size={18} className="text-outline" /> <span className="text-sm font-bold text-outline uppercase">Mic Idle</span></>
              )}
            </div>

            {/* Core Controls */}
            <div className="flex items-center gap-3">
              <button onClick={() => setIsVideoOn(!isVideoOn)} className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg ${isVideoOn ? 'bg-surface-container-lowest text-on-surface hover:bg-surface-container' : 'bg-error text-white hover:bg-error/90'}`}>
                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button onClick={sim.toggleRecording} className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${sim.isRecording ? 'bg-primary text-white animate-pulse shadow-primary/30' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'}`}>
                {sim.isRecording ? <Square size={24} /> : <Mic size={24} />}
              </button>
              <button
                onClick={() => sim.setIsMuted(!sim.isMuted)}
                title={sim.isMuted ? 'Aktifkan Suara' : 'Matikan Suara'}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg relative overflow-hidden
                  ${sim.isMuted
                    ? 'bg-error text-white shadow-error/40 scale-105'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                  }`}
              >
                {sim.isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                {sim.isMuted && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-error border-2 border-inverse-surface animate-pulse" />
                )}
              </button>

            </div>

            {/* Extra Controls */}
            <div className="flex items-center gap-4 text-sm font-semibold text-on-surface bg-surface-container-lowest/80 glass px-4 py-2.5 rounded-lg shadow-sm">
              <button className="flex items-center gap-2 hover:text-primary"><BookOpen size={16} /> Notes</button>
              <button className="flex items-center gap-2 hover:text-primary"><Settings size={16} /> Audio Setup</button>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Transcript (Chat) */}
        <div className="flex flex-col w-full md:w-[400px] lg:w-[450px] min-h-0 bg-surface-container-lowest rounded-2xl border border-surface-container shadow-sm overflow-hidden flex-shrink-0">
          
          <div className="px-5 py-4 border-b border-surface-container flex justify-between items-center bg-surface-container-low">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Activity size={16} className="text-primary" /> Live Transcript
            </h2>
            <MoreVertical size={16} className="text-outline cursor-pointer" />
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0">
            {!sim.sessionStarted ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Play className="w-8 h-8 ml-1" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading">{sessionTitle}</h3>
                  <p className="text-sm text-outline mt-1 px-4">Simulator AI siap. Tekan tombol di bawah untuk memulai percakapan sesi ini.</p>
                </div>
                <button onClick={sim.startSession}
                  className="px-6 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition shadow-md flex items-center gap-2 mt-4">
                  <Play size={16} /> Start Simulation
                </button>
              </div>
            ) : (
              <>
                {sim.visibleMessages.map((m, idx) => (
                  <div key={m.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className={`text-xs font-bold mb-1 flex items-center gap-2 ${m.role === 'user' ? 'text-outline justify-end mr-1' : 'text-primary ml-1'}`}>
                      {m.role === 'user' ? 'You' : 'AI Persona'}
                      {m.role !== 'user' && <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center"><User size={12} className="text-primary"/></span>}
                      {m.role === 'user' && <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center"><User size={12} className="text-outline"/></span>}
                    </p>
                    
                    <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                        m.role === 'user'
                          ? 'bg-primary text-white rounded-tr-sm'
                          : 'bg-surface-container-low text-on-surface border border-surface-container rounded-tl-sm'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                    {/* Mock AI Insight Chip on user messages occasionally */}
                    {m.role === 'user' && idx % 3 === 0 && idx > 0 && (
                      <div className="flex justify-end mt-2">
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-secondary-container text-on-secondary-container flex items-center gap-1">
                          <CheckCircle2 size={10} /> Good Response
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {sim.isLoading && (
                  <div className="animate-in fade-in duration-300">
                    <p className="text-xs font-bold mb-1 flex items-center gap-2 text-primary ml-1">
                      AI Persona <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center"><User size={12} className="text-primary"/></span>
                    </p>
                    <div className="flex justify-start">
                      <div className="bg-surface-container-low border border-surface-container rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex gap-1.5">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={sim.messagesEndRef} />
              </>
            )}
          </div>

          {/* Chat Input */}
          {sim.sessionStarted && (
            <form onSubmit={sim.handleSend} className="shrink-0 p-4 border-t border-surface-container bg-surface-container-lowest">
              <div className="relative flex items-center">
                <input
                  className="w-full bg-surface-container-low border border-surface-container rounded-xl pl-4 pr-12 py-3 text-sm text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary/50 transition shadow-inner"
                  value={sim.input}
                  onChange={e => sim.setInput(e.target.value)}
                  placeholder={sim.isLoading ? 'Analyzing input...' : 'Type your response...'}
                  disabled={sim.isLoading}
                  autoFocus
                />
                <button type="submit" disabled={sim.isLoading || !sim.input.trim()}
                  className="absolute right-2 p-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-30 transition">
                  <Play size={16} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
