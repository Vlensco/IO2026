'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Building2, ShoppingBag, GraduationCap, PlaneTakeoff, HeartPulse, 
  Banknote, Cpu, ShieldAlert, UtensilsCrossed, Users, Stethoscope, 
  PhoneCall, Gavel, Handshake, Landmark, ChevronRight, Globe, 
  Search, LayoutGrid, History, User, Lock, Camera, RefreshCcw, Loader2,
  Beaker, Briefcase
} from 'lucide-react';
import UserProfileWidget from '@/components/UserProfileWidget';

const ICON_MAP: Record<string, any> = {
  'HeartPulse': <HeartPulse className="text-rose-400 w-5 h-5" />,
  'Cpu': <Cpu className="text-blue-400 w-5 h-5" />,
  'Banknote': <Banknote className="text-emerald-400 w-5 h-5" />,
  'PlaneTakeoff': <PlaneTakeoff className="text-sky-400 w-5 h-5" />,
  'ShieldAlert': <ShieldAlert className="text-orange-400 w-5 h-5" />,
  'UtensilsCrossed': <UtensilsCrossed className="text-red-400 w-5 h-5" />,
  'PhoneCall': <PhoneCall className="text-violet-400 w-5 h-5" />,
  'Gavel': <Gavel className="text-yellow-400 w-5 h-5" />,
  'GraduationCap': <GraduationCap className="text-green-400 w-5 h-5" />,
  'Building2': <Building2 className="text-slate-400 w-5 h-5" />,
  'Users': <Users className="text-pink-400 w-5 h-5" />,
  'Handshake': <Handshake className="text-amber-400 w-5 h-5" />,
  'Landmark': <Landmark className="text-indigo-400 w-5 h-5" />,
  'ShoppingBag': <ShoppingBag className="text-fuchsia-400 w-5 h-5" />,
  'Stethoscope': <Stethoscope className="text-teal-400 w-5 h-5" />,
  'Briefcase': <Briefcase className="text-blue-400 w-5 h-5" />,
};

type Tab = 'explore' | 'history' | 'profile';

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('explore');
  const [categories, setCategories] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [notif, setNotif] = useState('');

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(''), 3000); };

  useEffect(() => {
    async function loadData() {
      // Load categories
      const { data: cats } = await supabase.from('categories').select('*').order('title');
      setCategories(cats || []);

      // Load user data
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (user) {
        const { data: prof } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
        const { data: sess } = await supabase.from('sessions').select('*, scenarios(title)').eq('user_id', user.id).order('created_at', { ascending: false });
        setSessions(sess || []);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const toggleFilter = (title: string) => {
    setSelectedFilters(prev => prev.includes(title) ? prev.filter(f => f !== title) : [...prev, title]);
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const matchSearch = cat.title.toLowerCase().includes(searchQuery.toLowerCase()) || cat.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = selectedFilters.length === 0 || selectedFilters.includes(cat.title);
      return matchSearch && matchFilter;
    });
  }, [categories, searchQuery, selectedFilters]);

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) { notify('Kata sandi minimal 6 karakter!'); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) notify('Gagal: ' + error.message);
    else { notify('Kata sandi berhasil diperbarui!'); setNewPassword(''); }
  };

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'explore', label: 'Jelajahi Skenario', icon: <LayoutGrid className="w-4 h-4" /> },
    { key: 'history', label: 'Riwayat Ujian', icon: <History className="w-4 h-4" /> },
    { key: 'profile', label: 'Profil Saya', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 w-full flex flex-col max-w-[90rem] mx-auto font-sans min-h-0">
      
      {/* Notif */}
      {notif && (
        <div className="fixed top-6 right-6 z-50 bg-green-900/80 border border-green-500/40 text-green-100 px-6 py-4 rounded-2xl shadow-xl backdrop-blur-xl text-sm font-semibold">
          {notif}
        </div>
      )}

      {/* Sub Navbar — clean underline, no backdrop, no sticky */}
      <div className="w-full border-b border-white/10 shrink-0">
        <div className="max-w-[90rem] mx-auto px-4 md:px-8 flex gap-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-px ${
                tab === t.key
                  ? 'text-white border-primary'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content Area — same for all tabs */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[90rem] mx-auto p-4 md:p-8 space-y-8">

        {/* User Profile HUD — only on explore and history */}
        {tab !== 'profile' && <UserProfileWidget />}

      {/* ===================== TAB: EXPLORE ===================== */}
      {tab === 'explore' && (
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold font-heading text-white mb-2">Pusat Simulasi Karir</h1>
            <p className="text-slate-400">Pilih industri dan taklukkan skenario ekstrem berbasis AI.</p>
          </div>

          {/* Search & Filter Row */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari skenario, industri, atau kata kunci..."
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary outline-none transition text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Checkboxes */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleFilter(cat.title)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedFilters.includes(cat.title) ? 'bg-primary border-primary text-white' : 'border-slate-700 text-slate-400 hover:border-primary/50'}`}
                >
                  {ICON_MAP[cat.icon_name] || <Beaker className="w-3 h-3" />}
                  {cat.title}
                </button>
              ))}
              {selectedFilters.length > 0 && (
                <button onClick={() => setSelectedFilters([])} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-500/40 text-red-400 hover:bg-red-500/10 transition">
                  ✕ Reset Filter
                </button>
              )}
            </div>
          )}

          {/* Live Telemetry */}
          <div className="glass-card p-4 rounded-2xl border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Globe className="w-4 h-4 text-blue-400 animate-pulse" />
              <span>Global Telemetry</span>
            </div>
            <div className="flex gap-8">
              <div className="text-right"><p className="text-xl font-bold text-white">45.2K</p><p className="text-xs text-slate-500">Sesi Selesai</p></div>
              <div className="text-right"><p className="text-xl font-bold text-green-400">12</p><p className="text-xs text-slate-500">Provinsi</p></div>
            </div>
          </div>

          {/* Categories Grid */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/dashboard/category/${cat.id}`}
                  className="glass-card rounded-3xl p-6 group hover:border-slate-500 transition-colors flex flex-col border border-white/5"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-slate-800 rounded-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                      {ICON_MAP[cat.icon_name] || <Beaker className="w-5 h-5 text-white" />}
                    </div>
                    <h3 className="text-lg font-bold text-white">{cat.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm mb-5 leading-relaxed flex-1">{cat.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Lihat semua skenario</span>
                    <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}

              {filteredCategories.length === 0 && (
                <div className="col-span-3 text-center py-20 text-slate-500 italic">
                  Tidak ada kategori yang cocok dengan pencarian atau filter kamu.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: HISTORY ===================== */}
      {tab === 'history' && (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold font-heading text-white">Riwayat Ujian Kamu</h1>
          {sessions.length === 0 ? (
            <div className="text-center py-20 text-slate-500 italic">Kamu belum menyelesaikan satu pun sesi simulasi.</div>
          ) : (
            <div className="space-y-4">
              {sessions.map((s: any) => (
                <div key={s.id} className="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-semibold">{s.scenarios?.title || s.scenario_id}</p>
                    <p className="text-slate-500 text-xs mt-1">{new Date(s.created_at).toLocaleString('id-ID')}</p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-blue-400">Kesabaran: <strong>{s.patience_score}</strong></span>
                      <span className="text-violet-400">Kejelasan: <strong>{s.clarity_score}</strong></span>
                    </div>
                  </div>
                  <Link
                    href={`/simulator?id=${s.scenario_id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-xl text-sm font-semibold border border-primary/30 hover:bg-primary/30 transition shrink-0"
                  >
                    <RefreshCcw className="w-4 h-4" /> Ulang
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: PROFILE ===================== */}
      {tab === 'profile' && (
        <div className="max-w-5xl mx-auto w-full space-y-8 pb-12">
          <h1 className="text-3xl font-bold font-heading text-white">Profil Saya</h1>

          {/* 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

            {/* LEFT: Avatar + Ganti Password */}
            <div className="space-y-5">
              <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Foto Profil</h2>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg text-white text-3xl font-bold shrink-0">
                    {profile?.full_name?.charAt(0) || 'A'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-xl truncate">{profile?.full_name}</p>
                    <p className="text-slate-400 text-sm truncate">{profile?.email}</p>
                    <button className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                      <Camera className="w-3 h-3" /> Ganti Foto (Segera Hadir)
                    </button>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Ganti Kata Sandi
                </h2>
                <input
                  type="password"
                  placeholder="Kata sandi baru (min. 6 karakter)"
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary outline-none transition text-sm"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button
                  onClick={handleChangePassword}
                  disabled={pwLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm"
                >
                  {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Perbarui Kata Sandi
                </button>
              </div>

              <button
                onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}
                className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition"
              >
                Keluar dari Akun
              </button>
            </div>

            {/* RIGHT: Readiness Summary */}
            <div className="glass-card p-6 rounded-3xl border border-blue-500/20 space-y-5 h-full">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Ringkasan Kesiapan Mental
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 text-center">
                  <p className="text-slate-400 text-xs mb-1">Total Sesi</p>
                  <p className="text-4xl font-bold text-white">{sessions.length}</p>
                  <p className="text-slate-500 text-xs mt-1">Diselesaikan</p>
                </div>
                <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 text-center">
                  <p className="text-slate-400 text-xs mb-1">Rata-rata Skor</p>
                  <p className="text-4xl font-bold text-green-400">
                    {sessions.length > 0
                      ? `${Math.round(sessions.reduce((a: number, s: any) => a + ((s.patience_score + s.clarity_score) / 2), 0) / sessions.length)}%`
                      : '—'}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Kesiapan Kerja</p>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800 space-y-3">
                <p className="text-blue-400 text-xs font-bold flex items-center gap-2">
                  🤖 Kesimpulan AI
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {sessions.length === 0
                    ? 'Belum ada data. Selesaikan minimal 1 sesi simulasi untuk mendapatkan analisis kesiapan kerjamu.'
                    : sessions.length < 5
                    ? `Kamu baru memulai perjalanan ini dengan ${sessions.length} sesi. Terus berlatih untuk meningkatkan skor rata-ratamu!`
                    : `Dengan ${sessions.length} sesi yang telah diselesaikan, kamu berada di jalur yang sangat baik. Pertahankan konsistensinya untuk mencapai kesiapan kerja optimal!`}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Progress Kesiapan</span>
                  <span>{Math.min(sessions.length * 7, 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                    style={{ width: `${Math.min(sessions.length * 7, 100)}%` }}
                  />
                </div>
                <p className="text-slate-600 text-xs">Selesaikan lebih banyak sesi untuk meningkatkan skor!</p>
              </div>
            </div>

          </div>
        </div>
      )}

        </div> {/* end scrollable content */}
      </div> {/* end flex-1 overflow-y-auto */}
    </div>
  );
}
