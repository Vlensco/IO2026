'use client';

import { useEffect, useState } from 'react';
import { Star, MapPin, Zap, Brain, Target, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Particles } from '@/components/magicui/particles';
import { HyperText } from '@/components/magicui/hyper-text';
import { BlurFade, NumberTicker, WordRotate } from '@/components/magicui/animations';
import { useRouter } from 'next/navigation';

const REVIEWS = [
  { name: "Andi S.", role: "Siswa SMK Telkom Batam", stars: 5, feedback: "Skenario pelanggan ngamuk kerasa banget aslinya. Setelah 5x coba, saya jadi ngga takut lagi ngadepin komplain." },
  { name: "Budi P.", role: "Junior HR Manager", stars: 5, feedback: "Sistem scoring analisisnya akurat banget. Bilang saya terlalu pasif saat diinterupsi — dan itu bener!" },
  { name: "Clara M.", role: "Mahasiswi Psikologi", stars: 5, feedback: "Penyelamat sebelum sidang skripsi! Dosen pembimbing versi AInya lebih sadis dari yang asli, hahaha." },
  { name: "Deni I.", role: "B2B Sales Executive", stars: 5, feedback: "Platform ini gokil. Menghemat waktu roleplay antar tim sales kami senilai ratusan jam setiap bulannya." },
  { name: "Fira N.", role: "Perawat Puskesmas", stars: 4, feedback: "Latihan handling keluarga pasien panik itu nyata banget. Skenario IGD-nya bikin deg-degan." },
  { name: "Hendra K.", role: "Guru SMK", stars: 5, feedback: "Saya rekomendasikan ke seluruh siswa jurusan Pemasaran. Bisa latihan tanpa perlu malu salah." },
];

const CITIES = ["Batam", "Jakarta", "Surabaya", "Medan", "Bandung", "Makassar", "Yogyakarta", "Semarang", "Palembang", "Tangerang", "Depok", "Bogor"];

const SKILLS = ["Communication", "Negotiation", "Public Speaking", "Empathy", "Confidence", "Conflict Management"];

const METRICS = [
  { label: 'Sesi Diselesaikan', value: 45200, suffix: '+', formatK: true, color: 'text-primary' },
  { label: 'Peningkatan Kepercayaan Diri', value: 85, suffix: '%', formatK: false, color: 'text-secondary' },
  { label: 'Skenario Profesi', value: 375, suffix: '', formatK: false, color: 'text-accent' },
  { label: 'Provinsi Terhubung', value: 12, suffix: '', formatK: false, color: 'text-secondary' },
];

const FEATURES = [
  { icon: <Brain className="w-6 h-6 text-primary" />, title: 'AI Persona Realistis', desc: 'Berinteraksi dengan AI yang berperilaku layaknya manusia sungguhan — emosi, respons, dan tekanan nyata.' },
  { icon: <Target className="w-6 h-6 text-secondary" />, title: 'Scoring Berbasis AI', desc: 'Setiap respons dianalisis secara mendalam. Dapatkan laporan kesiapan kerja yang akurat dan actionable.' },
  { icon: <Sparkles className="w-6 h-6 text-accent" />, title: '375+ Skenario Profesi', desc: 'Dari wawancara kerja hingga negosiasi klien B2B — pilih industri sesuai impianmu.' },
];

export default function Home() {
  const [particleColor, setParticleColor] = useState('#3b82f6');
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        router.push('/dashboard');
      }
    });
    
    const isDark = document.documentElement.classList.contains('dark');
    setParticleColor(isDark ? '#3b82f6' : '#2563eb');

    const obs = new MutationObserver(() => {
      const d = document.documentElement.classList.contains('dark');
      setParticleColor(d ? '#3b82f6' : '#2563eb');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden">

      {/* ── PARTICLES BACKGROUND ── */}
      <Particles
        className="fixed inset-0 z-0 pointer-events-none"
        quantity={120}
        ease={80}
        size={0.5}
        staticity={30}
        color={particleColor}
      />

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-28 md:py-40 z-10">
        {/* Glowing orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-5xl w-full flex flex-col items-center space-y-8 relative z-10">

          <BlurFade delay={0.05} inView>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live AI Simulator &bull; Alpha Version 1.0
            </div>
          </BlurFade>

          <BlurFade delay={0.1} inView>
            <h1 className="text-5xl md:text-7xl font-bold font-heading leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary animate-gradient-x">
                Technology into Action,
              </span>
              <br />
              <span className="text-on-surface font-black">Ideas into </span>
              <WordRotate
                words={SKILLS}
                className="font-black text-primary underline decoration-primary/40 decoration-4 underline-offset-4"
              />
              <span className="text-on-surface font-black">.</span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.15} inView>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl font-sans leading-relaxed">
              Kuasai soft-skill sebelum memasuki dunia kerja nyata. SIMULOKA menghadirkan roleplay imersif berbasis AI langsung di browsermu.
            </p>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <motion.a
                href="/auth"
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white text-lg font-bold shadow-xl shadow-primary/30 flex items-center gap-3 relative overflow-hidden"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span>Mulai Sekarang</span>
                <ChevronRight className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="/auth"
                className="px-8 py-4 rounded-2xl border border-primary/30 text-primary text-base font-semibold hover:bg-primary/5 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Lihat Demo →
              </motion.a>
            </div>
          </BlurFade>

          {/* ── METRICS ── */}
          <BlurFade delay={0.25} inView className="w-full">
            <div className="mt-6 w-full max-w-3xl glass-card rounded-3xl p-8 flex flex-col md:flex-row items-center justify-around gap-6 mx-auto">
              {METRICS.map((m, i) => (
                <div key={m.label} className="text-center flex-1">
                  <h3 className={`text-4xl font-bold font-heading ${m.color} block`}>
                    <HyperText
                      startOnView
                      delay={i * 100}
                      duration={700}
                      animateOnHover
                      className={`text-4xl font-bold font-mono ${m.color}`}
                    >
                      {m.formatK
                        ? `${(m.value / 1000).toFixed(1)}K${m.suffix}`
                        : `${m.value}${m.suffix}`}
                    </HyperText>
                  </h3>
                  <p className="text-sm font-semibold text-on-surface-variant mt-2">{m.label}</p>
                </div>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20 z-10">
        <BlurFade delay={0.05} inView className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-on-surface mb-3">Mengapa SIMULOKA?</h2>
          <p className="text-on-surface-variant font-medium max-w-xl mx-auto">Platform pelatihan soft-skill pertama di Indonesia yang didukung AI generatif.</p>
        </BlurFade>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {FEATURES.map((f, i) => (
            <BlurFade key={f.title} delay={0.08 * (i + 1)} inView className="h-full">
              <motion.div
                className="glass-card h-full p-8 rounded-3xl border border-surface-container-highest hover:border-primary/30 transition-colors group cursor-default flex flex-col"
                whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(59,130,246,0.10)' }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shrink-0">
                  {f.icon}
                </div>
                <h3 className="text-on-surface font-bold text-lg mb-2 font-heading">{f.title}</h3>
                <p className="text-on-surface-variant font-medium text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ── CITY MARQUEE ── */}
      <section className="w-full py-12 z-10 overflow-hidden">
        <BlurFade delay={0.05} inView className="text-center mb-8">
          <h2 className="text-2xl font-bold font-heading text-on-surface mb-1">Tersebar di Seluruh Indonesia</h2>
          <p className="text-on-surface-variant font-medium text-sm">Digunakan oleh pelajar dan profesional di berbagai kota.</p>
        </BlurFade>
        <div className="flex gap-4 animate-marquee w-max">
          {[...CITIES, ...CITIES].map((city, i) => (
            <div key={i} className="flex items-center gap-2 glass-card px-5 py-2.5 rounded-full border border-surface-container-highest text-on-surface-variant text-sm shrink-0">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {city}
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 z-10">
        <BlurFade delay={0.05} inView className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-on-surface mb-3">Dampak Nyata dari Pengguna</h2>
          <p className="text-on-surface-variant font-medium">Dari siswa SMK hingga profesional — SIMULOKA terbukti meningkatkan kesiapan kerja.</p>
        </BlurFade>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((r, i) => (
            <BlurFade key={i} delay={0.06 * (i + 1)} inView>
              <motion.div
                className="glass-card p-6 rounded-3xl flex flex-col shadow-sm h-full border border-surface-container-highest"
                whileHover={{ y: -4, borderColor: 'rgba(59,130,246,0.3)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className={`w-4 h-4 ${idx < r.stars ? 'text-yellow-400 fill-yellow-400' : 'text-outline-variant'}`} />
                  ))}
                </div>
                <p className="text-on-surface text-sm leading-relaxed italic flex-1">"{r.feedback}"</p>
                <div className="flex items-center gap-3 mt-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white text-sm shrink-0">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-on-surface font-bold text-sm">{r.name}</p>
                    <p className="text-outline text-xs">{r.role}</p>
                  </div>
                </div>
              </motion.div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="w-full max-w-4xl mx-auto px-6 py-20 text-center z-10 pb-32">
        <BlurFade delay={0.05} inView>
          <motion.div
            className="glass-card border border-primary/20 rounded-3xl p-12 relative overflow-hidden shadow-2xl shadow-primary/10"
            whileHover={{ boxShadow: '0 30px 80px rgba(59,130,246,0.15)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent pointer-events-none" />
            <Particles className="absolute inset-0 z-0 opacity-50" quantity={40} color={particleColor} size={0.3} />
            <div className="relative z-10">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
                <Zap className="w-14 h-14 text-primary mx-auto mb-5" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-on-surface mb-4">Siap Menghadapi Dunia Nyata?</h2>
              <p className="text-on-surface-variant font-medium mb-8 max-w-md mx-auto">Daftarkan akun gratis dan langsung coba 375 skenario simulasi AI interaktif.</p>
              <motion.a
                href="/auth"
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-lg shadow-xl inline-flex items-center gap-2 relative overflow-hidden"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <Sparkles className="w-5 h-5" />
                Daftar Gratis Sekarang
              </motion.a>
            </div>
          </motion.div>
        </BlurFade>
      </section>

    </main>
  );
}
