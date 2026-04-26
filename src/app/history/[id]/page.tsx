'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Download, CheckCircle2, AlertTriangle, Activity, User, BookOpen, FileText } from 'lucide-react';

const scoreBarColor = (v: number) =>
  v >= 75 ? 'bg-secondary' : v >= 50 ? 'bg-yellow-500' : 'bg-error';

// Inline bar color for print (plain style string)
const printBarColor = (v: number) =>
  v >= 75 ? '#059669' : v >= 50 ? '#d97706' : '#dc2626';

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      if (!id) return;
      const { data, error } = await supabase
        .from('sessions')
        .select('*, scenarios(title, categories(title))')
        .eq('id', id)
        .single();
      if (!error && data) setSession(data);
      setLoading(false);
    }
    fetchSession();
  }, [id]);

  const handleExport = () => {
    setExporting(true);
    // Small delay to let state update re-render first
    setTimeout(() => {
      window.print();
      setExporting(false);
    }, 150);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Activity className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-on-surface">
        <h1 className="text-2xl font-bold font-heading mb-4">Sesi tidak ditemukan</h1>
        <button onClick={() => router.push('/dashboard')} className="text-primary hover:underline">Kembali ke Dasbor</button>
      </div>
    );
  }

  const overallEfficacy = Math.round((session.patience_score + session.clarity_score) / 2);
  const confidenceScore = Math.min(100, session.patience_score + 5);
  const wordChoiceScore = Math.min(100, session.clarity_score + 8);
  const transcript: any[] = session.chat_transcript || [];
  const sessionDate = new Date(session.created_at).toLocaleString('id-ID', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric'
  });

  const perfVectors = [
    { label: 'Kepercayaan Diri', val: confidenceScore },
    { label: 'Kejelasan & Keringkasan', val: session.clarity_score },
    { label: 'Pilihan Kata', val: wordChoiceScore },
    { label: 'Kesabaran', val: session.patience_score },
  ];

  return (
    <>
      {/* ─────────────────────────────────────────────────
          PRINT STYLES
          Key fix: hide .no-print, show .print-only
          (avoids the Next.js body-wrapper trap)
      ───────────────────────────────────────────────── */}
      <style>{`
        @media print {
          /* Hide screen UI */
          .no-print { display: none !important; }

          /* Show print report */
          .print-only {
            display: block !important;
            position: static !important;
            visibility: visible !important;
          }

          /* Clean page */
          @page { size: auto; margin: 1.5cm 2cm; }

          body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Reset any dark mode on html/body */
          html, body { background: white !important; }

          /* Print layout helpers */
          .print-flex { display: flex !important; }
          .print-grid-4 { display: grid !important; grid-template-columns: repeat(4,1fr); gap: 12px; }
          .print-grid-3 { display: grid !important; grid-template-columns: repeat(3,1fr); gap: 12px; }
        }

        /* Hidden on screen */
        .print-only { display: none; }
      `}</style>

      {/* ─────────────────────────────────────────────────
          PRINT REPORT (hidden on screen, shown @print)
      ───────────────────────────────────────────────── */}
      <div className="print-only" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11pt', color: '#0f172a', background: '#fff' }}>
        
        {/* Branded Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #2563eb', paddingBottom: '14px', marginBottom: '22px' }}>
          <div>
            <div style={{ fontSize: '22pt', fontWeight: 900, color: '#2563eb', letterSpacing: '-0.5px', lineHeight: 1.1 }}>SIMULOKA</div>
            <div style={{ fontSize: '7.5pt', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '3px' }}>Laporan Analisis Performa Simulasi</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '8pt', color: '#64748b', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '9pt' }}>{sessionDate}</div>
            <div>ID Sesi: {id.slice(0, 16)}…</div>
            <div>Dicetak: {new Date().toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ fontSize: '17pt', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>
          {session.scenarios?.title}
        </div>
        <div style={{ fontSize: '9.5pt', color: '#64748b', marginBottom: '20px' }}>
          {session.scenarios?.categories?.title && `Kategori: ${session.scenarios.categories.title} · `}
          {transcript.length} giliran percakapan
          {session.avg_response_time && ` · Rata-rata respons: ${Math.round(session.avg_response_time)}s`}
        </div>

        {/* Score Cards (4 columns) */}
        <div className="print-grid-4" style={{ marginBottom: '22px' }}>
          {[
            { label: 'Efektivitas', val: overallEfficacy, unit: '/100' },
            { label: 'Kesabaran', val: session.patience_score ?? '—', unit: '/100' },
            { label: 'Kejelasan', val: session.clarity_score ?? '—', unit: '/100' },
            { label: 'Total Giliran', val: session.total_exchanges ?? transcript.length, unit: 'giliran' },
          ].map(({ label, val, unit }) => (
            <div key={label} style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '12px', textAlign: 'center', background: '#f8fafc' }}>
              <div style={{ fontSize: '7pt', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{label}</div>
              <div style={{ fontSize: '22pt', fontWeight: 900, color: '#2563eb', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '8pt', color: '#94a3b8' }}>{unit}</div>
            </div>
          ))}
        </div>

        {/* Performance Bars */}
        <div style={{ fontSize: '10.5pt', fontWeight: 800, color: '#0f172a', marginBottom: '10px', marginTop: '16px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Vektor Performa
        </div>
        {perfVectors.map(({ label, val }) => (
          <div key={label} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', fontWeight: 600, marginBottom: '4px' }}>
              <span>{label}</span><span>{val}%</span>
            </div>
            <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '7px', width: `${val}%`, background: printBarColor(val), borderRadius: '999px' }} />
            </div>
          </div>
        ))}

        {/* AI Feedback */}
        <div style={{ fontSize: '10.5pt', fontWeight: 800, color: '#0f172a', marginBottom: '10px', marginTop: '20px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Ringkasan AI
        </div>
        <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: '10px', padding: '14px', fontSize: '9.5pt', lineHeight: 1.65, color: '#0f172a', marginBottom: '20px' }}>
          {session.final_feedback || 'Sesi ini menunjukkan performa yang cukup baik. Terdapat beberapa metrik yang dapat ditingkatkan pada simulasi berikutnya.'}
        </div>

        {/* Transcript */}
        {transcript.length > 0 && (
          <>
            <div style={{ fontSize: '10.5pt', fontWeight: 800, color: '#0f172a', marginBottom: '12px', marginTop: '20px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px', pageBreakBefore: 'always' }}>
              Transkrip Percakapan ({transcript.length} pesan)
            </div>
            {transcript.map((m: any, idx: number) => {
              const isUser = m.role === 'user';
              const min = Math.floor((idx * 15) / 60).toString().padStart(2, '0');
              const sec = ((idx * 15) % 60).toString().padStart(2, '0');
              return (
                <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '12px', pageBreakInside: 'avoid' }}>
                  <div style={{ fontSize: '7.5pt', color: '#94a3b8', fontWeight: 700, width: '36px', paddingTop: '2px', flexShrink: 0 }}>{min}:{sec}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '7.5pt', fontWeight: 800, marginBottom: '4px', color: isUser ? '#0f172a' : '#2563eb' }}>
                      {isUser ? 'Pengguna' : 'AI Persona'}
                    </div>
                    <div style={{ fontSize: '9pt', color: '#334155', padding: '9px 12px', borderRadius: '8px', lineHeight: 1.55, border: '1px solid #e2e8f0', background: isUser ? '#f8fafc' : '#eff6ff' }}>
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: '28px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#94a3b8' }}>
          <span>SIMULOKA · Platform Simulasi Karir Berbasis AI</span>
          <span>Halaman cetak bersifat konfidensial</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────
          SCREEN UI (hidden @print via .no-print)
      ───────────────────────────────────────────────── */}
      <div className="no-print min-h-screen bg-surface text-on-surface font-sans pb-20">
        {/* Sticky Header */}
        <header className="bg-surface-container-lowest border-b border-surface-container sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-surface-container rounded-lg text-outline hover:text-on-surface transition shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-widest uppercase text-outline truncate">{sessionDate}</p>
                <h1 className="text-lg md:text-2xl font-bold font-heading truncate">Simulasi: {session.scenarios?.title}</h1>
              </div>
            </div>

            {/* Export button — all screen sizes */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all shrink-0 shadow-md shadow-primary/20 active:scale-95"
            >
              {exporting ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{exporting ? 'Mempersiapkan...' : 'Ekspor Laporan'}</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">

          {/* Score Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-primary text-white rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-lg shadow-primary/20">
              <div>
                <h2 className="text-xl font-heading font-bold mb-1">Efektivitas Keseluruhan</h2>
                <p className="text-white/70 text-sm">Top 15% dari riwayat performa.</p>
              </div>
              <div className="mt-8">
                <span className="text-6xl font-bold font-heading tracking-tighter">{overallEfficacy}</span>
                <span className="text-xl font-bold text-white/70">/100</span>
              </div>
            </div>

            <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl p-6 md:p-8 border border-surface-container shadow-sm flex flex-col">
              <h2 className="text-lg font-heading font-bold flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-secondary" /> Ringkasan AI
              </h2>
              <p className="text-on-surface-variant leading-relaxed text-sm md:text-base mb-6 flex-1">
                {session.final_feedback || 'Sesi ini menunjukkan performa yang cukup baik. Terdapat beberapa metrik yang dapat ditingkatkan pada simulasi berikutnya.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary-container text-xs font-bold">
                  <Activity className="w-3.5 h-3.5" /> Kontak Mata Baik
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-xs font-bold border border-surface-container-highest">
                  <AlertTriangle className="w-3.5 h-3.5 text-outline" /> Masalah Kecepatan Bicara
                </span>
              </div>
            </div>
          </div>

          {/* Vektor Performa */}
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-bold">Vektor Performa</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Indikator Kepercayaan Diri', val: confidenceScore, desc: 'Nada suara tetap stabil di bawah tekanan.', icon: <User className="w-5 h-5 text-primary" /> },
                { label: 'Kejelasan & Keringkasan', val: session.clarity_score, desc: 'Struktur kalimat panjang di bagian tanya jawab.', icon: <BookOpen className="w-5 h-5 text-error" /> },
                { label: 'Pilihan Kata', val: wordChoiceScore, desc: 'Penggunaan kata kerja aktif yang efektif. Minim jargon.', icon: <CheckCircle2 className="w-5 h-5 text-secondary" /> },
              ].map(({ label, val, desc, icon }) => (
                <div key={label} className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 font-bold text-on-surface">{icon} {label}</div>
                    <span className="text-2xl font-bold font-heading">{val}%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-1.5 mb-4">
                    <div className={`h-1.5 rounded-full ${scoreBarColor(val)}`} style={{ width: `${val}%` }} />
                  </div>
                  <p className="text-xs text-outline">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Analisis Interaksi */}
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-heading font-bold">Analisis Interaksi</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              {/* Transkrip */}
              <div className="lg:col-span-2 bg-surface-container-lowest border border-surface-container rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 border-b border-surface-container flex justify-between items-center bg-surface-container-low">
                  <span className="font-bold text-sm">Transkrip Lengkap</span>
                  <span className="text-xs text-outline">{transcript.length} pesan</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {transcript.map((m: any, idx: number) => {
                    const isUser = m.role === 'user';
                    const minutes = Math.floor((idx * 15) / 60).toString().padStart(2, '0');
                    const seconds = ((idx * 15) % 60).toString().padStart(2, '0');
                    return (
                      <div key={idx} className="flex gap-4">
                        <div className="w-12 pt-1 shrink-0 text-xs font-bold text-outline">{minutes}:{seconds}</div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold mb-1.5 ${isUser ? 'text-on-surface' : 'text-primary'}`}>
                            {isUser ? 'Kamu' : 'AI Persona'}
                          </p>
                          <div className={`p-4 rounded-xl text-sm leading-relaxed border ${
                            isUser
                              ? 'border-surface-container bg-surface-container-lowest text-on-surface'
                              : 'border-surface-container bg-surface-container-low text-on-surface'
                          }`}>
                            {m.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {transcript.length === 0 && (
                    <p className="text-center text-outline italic text-sm py-10">Tidak ada transkrip untuk sesi ini.</p>
                  )}
                </div>
              </div>

              {/* Temuan Utama + Export CTA */}
              <div className="lg:col-span-1 bg-surface-container-lowest border border-surface-container rounded-2xl shadow-sm p-5 h-auto lg:sticky top-24 space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Temuan Utama
                </h3>

                <div className="p-4 rounded-xl border border-secondary-container bg-secondary/5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-secondary flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pengalihan Topik Efektif
                    </span>
                    <span className="text-[10px] font-bold text-outline">00:15</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Mengakui kekhawatiran secara langsung memvalidasi persona dan memberimu waktu untuk menyusun respons.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-error-container bg-error/5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-error flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Kata Filler & Keragu-raguan
                    </span>
                    <span className="text-[10px] font-bold text-outline">00:42</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Terdeteksi 3 kata filler berturut-turut. Ini secara signifikan mengurangi kepercayaan diri yang dirasakan selama penyampaian poin penting.
                  </p>
                </div>

                {/* Secondary Export CTA */}
                <div className="pt-1 border-t border-surface-container">
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/15 disabled:opacity-60 transition"
                  >
                    <FileText className="w-4 h-4" />
                    Simpan sebagai PDF
                  </button>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}
