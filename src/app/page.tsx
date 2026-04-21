import { Star, MapPin, Users, Zap } from 'lucide-react';

const REVIEWS = [
  { name: "Andi S.", role: "Siswa SMK Telkom Batam", stars: 5, feedback: "Skenario pelanggan ngamuk kerasa banget aslinya. Setelah 5x coba, saya jadi ngga takut lagi ngadepin komplain." },
  { name: "Budi P.", role: "Junior HR Manager", stars: 5, feedback: "Sistem scoring analisisnya akurat banget. Bilang saya terlalu pasif saat diinterupsi — dan itu bener!" },
  { name: "Clara M.", role: "Mahasiswi Psikologi", stars: 5, feedback: "Penyelamat sebelum sidang skripsi! Dosen pembimbing versi AInya lebih sadis dari yang asli, hahaha." },
  { name: "Deni I.", role: "B2B Sales Executive", stars: 5, feedback: "Platform ini gokil. Menghemat waktu roleplay antar tim sales kami senilai ratusan jam setiap bulannya." },
  { name: "Fira N.", role: "Perawat Puskesmas", stars: 4, feedback: "Latihan handling keluarga pasien panik itu nyata banget. Skenario IGD-nya bikin deg-degan." },
  { name: "Hendra K.", role: "Guru SMK", stars: 5, feedback: "Saya rekomendasikan ke seluruh siswa jurusan Pemasaran. Bisa latihan tanpa perlu malu salah." },
];

const CITIES = ["Batam", "Jakarta", "Surabaya", "Medan", "Bandung", "Makassar", "Yogyakarta", "Semarang", "Palembang", "Tangerang", "Depok", "Bogor"];

export default function Home() {
  return (
    <main className="flex-1 flex flex-col relative overflow-hidden">
      
      {/* Decorative Blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-8 py-24 md:py-36 z-10">
        <div className="max-w-4xl w-full flex flex-col items-center space-y-8">
          
          <div className="inline-flex items-center px-4 py-2 rounded-full glass border-primary/30 text-primary-50 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
            Live AI Simulator • Alpha Version 1.0
          </div>

          <h1 className="text-5xl md:text-7xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-slate-400">
            Technology into Action,<br className="hidden md:block" /> Ideas into Impact.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl font-sans">
            Kuasai soft-skill sebelum memasuki dunia kerja nyata. Simulacra menghadirkan roleplay imersif berbasis AI langsung di browsermu.
          </p>

          <a href="/auth" className="mt-4 px-10 py-5 rounded-2xl bg-gradient-to-r from-primary to-accent text-white text-lg font-bold hover:opacity-90 transition-opacity shadow-xl shadow-primary/30 flex items-center space-x-3">
            <span>Mulai Sekarang</span>
            <span className="text-2xl">→</span>
          </a>

          {/* Impact Metrics */}
          <div className="mt-8 w-full max-w-3xl glass-card rounded-3xl p-8 flex flex-col md:flex-row items-center justify-around gap-4">
            <div className="text-center p-4">
              <h3 className="text-4xl font-bold font-heading text-white">45.2K+</h3>
              <p className="text-sm text-slate-400 mt-2">Sesi Diselesaikan</p>
            </div>
            <div className="hidden md:block w-px h-16 bg-white/10" />
            <div className="text-center p-4">
              <h3 className="text-4xl font-bold font-heading text-primary">85%</h3>
              <p className="text-sm text-slate-400 mt-2">Peningkatan Kepercayaan Diri</p>
            </div>
            <div className="hidden md:block w-px h-16 bg-white/10" />
            <div className="text-center p-4">
              <h3 className="text-4xl font-bold font-heading text-accent">375</h3>
              <p className="text-sm text-slate-400 mt-2">Skenario Profesi</p>
            </div>
            <div className="hidden md:block w-px h-16 bg-white/10" />
            <div className="text-center p-4">
              <h3 className="text-4xl font-bold font-heading text-green-400">12</h3>
              <p className="text-sm text-slate-400 mt-2">Provinsi Terhubung</p>
            </div>
          </div>
        </div>
      </section>

      {/* City Spread Section */}
      <section className="w-full max-w-5xl mx-auto px-8 py-16 z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-heading text-white mb-3">Tersebar di Seluruh Indonesia</h2>
          <p className="text-slate-400">Simulacra sudah digunakan oleh pelajar dan profesional di berbagai kota.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {CITIES.map((city) => (
            <div key={city} className="flex items-center gap-2 glass-card px-5 py-2.5 rounded-full border border-white/5 text-slate-300 text-sm hover:border-primary/30 transition-colors">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {city}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full max-w-7xl mx-auto px-8 py-16 z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-heading text-white mb-3">Dampak Nyata (Testimoni Pengguna)</h2>
          <p className="text-slate-400">Dari siswa SMK hingga profesional — Simulacra terbukti meningkatkan kesiapan kerja.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((r, i) => (
            <div key={i} className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className={`w-4 h-4 ${idx < r.stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed italic flex-1">"{r.feedback}"</p>
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white text-sm shrink-0">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{r.name}</p>
                  <p className="text-slate-500 text-xs">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="w-full max-w-4xl mx-auto px-8 py-16 text-center z-10 pb-24">
        <div className="glass-card border border-primary/20 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 pointer-events-none" />
          <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold font-heading text-white mb-4">Siap Menghadapi Dunia Nyata?</h2>
          <p className="text-slate-400 mb-8">Daftarkan akun gratis dan langsung coba 375 skenario simulasi AI interaktif.</p>
          <a href="/auth" className="px-10 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-lg hover:opacity-90 transition shadow-xl inline-block">
            Daftar Gratis Sekarang
          </a>
        </div>
      </section>

    </main>
  );
}
