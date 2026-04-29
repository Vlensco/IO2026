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
  Beaker, Briefcase, BookOpen, Sparkles, TrendingUp
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
  'BookOpen': <BookOpen className="text-indigo-400 w-5 h-5" />,
};

const ROLE_META: Record<string, { label: string; emoji: string; color: string; heroTitle: string; heroDesc: string }> = {
  siswa_sma: {
    label: 'Siswa SMA/SMK', emoji: '🎓', color: 'text-emerald-400',
    heroTitle: 'Siap Jadi Juara?',
    heroDesc: 'Latih komunikasi sebelum wawancara beasiswa, presentasi OSIS, dan debut karir pertamamu.',
  },
  mahasiswa: {
    label: 'Mahasiswa', emoji: '📚', color: 'text-blue-400',
    heroTitle: 'Kuasai Dunia Akademik & Karir',
    heroDesc: 'Dari sidang skripsi hingga interview magang — semua skenario kritismu ada di sini.',
  },
  pekerja: {
    label: 'Profesional', emoji: '💼', color: 'text-violet-400',
    heroTitle: 'Tingkatkan Level Profesionalmu',
    heroDesc: 'Negosiasi klien, manajemen konflik tim, hingga presentasi boardroom — semua terlatih.',
  },
};

type Tab = 'explore' | 'history' | 'profile';

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('explore');
  const [categories, setCategories] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [notif, setNotif] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(''), 3000); };

  useEffect(() => {
    async function loadData() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      // Ambil SEMUA kategori dulu
      const { data: cats } = await supabase.from('categories').select('*').order('title');
      const allCats = cats || [];
      setAllCategories(allCats);

      if (user) {
        const { data: prof } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        // Filter berdasarkan role
        const userRole = prof?.role || null;
        const filtered = allCats.filter((cat: any) => {
          if (!userRole) return true;
          if (!cat.target_roles || cat.target_roles.length === 0) return true;
          return cat.target_roles.includes(userRole);
        });
        setCategories(filtered);

        const { data: sess } = await supabase
          .from('sessions')
          .select('*, scenarios(title)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setSessions(sess || []);
        setLoading(false);
      } else {
        router.push('/auth');
      }
    }
    loadData();
  }, []);

  const toggleFilter = (title: string) => {
    setSelectedFilters(prev => prev.includes(title) ? prev.filter(f => f !== title) : [...prev, title]);
  };

  const filteredCategories = useMemo(() => {
    const source = showAll ? allCategories : categories;
    return source.filter(cat => {
      const matchSearch = cat.title.toLowerCase().includes(searchQuery.toLowerCase())
        || (cat.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = selectedFilters.length === 0 || selectedFilters.includes(cat.title);
      return matchSearch && matchFilter;
    });
  }, [categories, allCategories, searchQuery, selectedFilters, showAll]);

  const handleChangeRole = async (newRole: string) => {
    setRoleLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) { notify('Login diperlukan'); setRoleLoading(false); return; }
    const { error } = await supabase.from('user_profiles').update({ role: newRole }).eq('id', uid);
    setRoleLoading(false);
    if (error) { notify('Gagal mengubah role: ' + error.message); return; }
    setProfile((p: any) => ({ ...p, role: newRole }));
    // Refilter categories
    const filtered = allCategories.filter((cat: any) => {
      if (!cat.target_roles || cat.target_roles.length === 0) return true;
      return cat.target_roles.includes(newRole);
    });
    setCategories(filtered);
    notify('Role berhasil diubah ke: ' + ROLE_META[newRole]?.label);
  };

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

  const roleMeta = profile?.role ? ROLE_META[profile.role] : null;
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((a: number, s: any) => a + ((s.patience_score + s.clarity_score) / 2), 0) / sessions.length)
    : null;

  return (
    <div className="flex-1 w-full flex flex-col max-w-[90rem] mx-auto font-sans min-h-0">

      {/* Notif */}
      {notif && (
        <div className="fixed top-6 right-6 z-50 bg-green-900/80 border border-green-500/40 text-green-100 px-6 py-4 rounded-2xl shadow-xl backdrop-blur-xl text-sm font-semibold">
          {notif}
        </div>
      )}

      {/* Tab Nav */}
      <div className="w-full border-b border-surface-container shrink-0">
        <div className="max-w-[90rem] mx-auto px-4 md:px-8 flex gap-0 items-center justify-between">
          <div className="flex">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-px ${
                  tab === t.key ? 'text-on-surface border-primary' : 'text-on-surface-variant border-transparent hover:text-on-surface hover:border-surface-container-highest'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          {/* Role Badge */}
          {roleMeta && (
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-surface-container-highest text-xs font-semibold ${roleMeta.color}`}>
              <span>{roleMeta.emoji}</span>
              <span>{roleMeta.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[90rem] mx-auto p-4 md:p-8 space-y-8">

          {tab !== 'profile' && <UserProfileWidget />}

          {/* ===== EXPLORE ===== */}
          {tab === 'explore' && (
            <div className="space-y-8">
              {/* Role Hero Banner */}
              {roleMeta ? (
                <div className="relative glass-card rounded-3xl p-6 md:p-8 border border-surface-container overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className={`text-sm font-semibold ${roleMeta.color} mb-1`}>{roleMeta.emoji} Mode: {roleMeta.label}</p>
                      <h1 className="text-2xl md:text-3xl font-bold font-heading text-on-surface">{roleMeta.heroTitle}</h1>
                      <p className="text-on-surface-variant mt-1 text-sm max-w-lg">{roleMeta.heroDesc}</p>
                    </div>
                    {avgScore !== null && (
                      <div className="shrink-0 text-center glass-card rounded-2xl px-6 py-4 border border-surface-container">
                        <p className="text-on-surface-variant text-xs mb-1">Skor Kesiapan</p>
                        <p className="text-3xl font-bold text-on-surface">{avgScore}<span className="text-lg text-on-surface-variant">%</span></p>
                        <p className="text-xs text-outline mt-1">{sessions.length} sesi selesai</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold font-heading text-on-surface mb-2">Pusat Simulasi Karir</h1>
                  <p className="text-on-surface-variant">Pilih industri dan taklukkan skenario ekstrem berbasis AI.</p>
                </div>
              )}

              {/* Search + Show All */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input type="text" placeholder="Cari skenario, industri..."
                    className="w-full bg-surface-container border border-surface-container-highest text-on-surface rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary outline-none transition text-sm"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {profile?.role && (
                  <button
                    onClick={() => setShowAll(p => !p)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold transition shrink-0 ${showAll ? 'bg-primary/20 border-primary/40 text-primary' : 'border-surface-container-highest text-on-surface-variant hover:border-outline'}`}>
                    <Globe className="w-3.5 h-3.5" />
                    {showAll ? `Semua Kategori (${allCategories.length})` : `Filter Role (${categories.length})`}
                  </button>
                )}
              </div>

              {/* Filter Chips */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => toggleFilter(cat.title)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selectedFilters.includes(cat.title)
                          ? 'bg-primary border-primary text-white'
                          : 'border-surface-container-highest text-on-surface-variant hover:border-primary/50'
                      }`}>
                      {ICON_MAP[cat.icon_name] || <Beaker className="w-3 h-3" />}
                      {cat.title}
                    </button>
                  ))}
                  {selectedFilters.length > 0 && (
                    <button onClick={() => setSelectedFilters([])}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-500/40 text-red-400 hover:bg-red-500/10 transition">
                      ✕ Reset
                    </button>
                  )}
                </div>
              )}

              {/* Live Telemetry */}
              <div className="glass-card p-4 rounded-2xl border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <Globe className="w-4 h-4 text-primary animate-pulse" />
                  <span>Global Telemetry</span>
                </div>
                <div className="flex gap-8">
                  <div className="text-right"><p className="text-xl font-bold text-on-surface">45.2K</p><p className="text-xs text-outline">Sesi Selesai</p></div>
                  <div className="text-right"><p className="text-xl font-bold text-secondary">12</p><p className="text-xs text-outline">Provinsi</p></div>
                </div>
              </div>

              {/* Categories Grid */}
              {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredCategories.map((cat) => (
                    <Link key={cat.id} href={`/dashboard/category/${cat.id}`}
                      className="glass-card rounded-3xl p-6 group hover:border-primary/50 transition-all flex flex-col border border-surface-container-highest hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-surface-container rounded-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0">
                          {ICON_MAP[cat.icon_name] || <Beaker className="w-5 h-5 text-on-surface" />}
                        </div>
                        <h3 className="text-lg font-bold text-on-surface">{cat.title}</h3>
                      </div>
                      <p className="text-on-surface-variant text-sm mb-5 leading-relaxed flex-1">{cat.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-outline">Lihat semua skenario</span>
                        <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                  {filteredCategories.length === 0 && (
                    <div className="col-span-3 text-center py-20 text-outline italic">
                      Tidak ada kategori yang cocok. Coba ubah filter atau kata kunci pencarian.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== HISTORY ===== */}
          {tab === 'history' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold font-heading text-on-surface">Riwayat Ujian Kamu</h1>
              {sessions.length === 0 ? (
                <div className="text-center py-20 text-outline italic">Kamu belum menyelesaikan satu pun sesi simulasi.</div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((s: any) => (
                    <div key={s.id} className="glass-card rounded-2xl p-5 border border-surface-container-highest flex items-center justify-between gap-4 hover:border-primary/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-on-surface font-semibold truncate">{s.scenarios?.title || s.scenario_id}</p>
                        <p className="text-on-surface-variant text-xs mt-1">{new Date(s.created_at).toLocaleString('id-ID')}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs">
                          <span className="text-primary">Kesabaran: <strong>{s.patience_score ?? '—'}</strong></span>
                          <span className="text-accent">Kejelasan: <strong>{s.clarity_score ?? '—'}</strong></span>
                          {s.total_exchanges && <span className="text-outline">{s.total_exchanges} giliran</span>}
                          {s.avg_response_time && <span className="text-outline">⏱ {Math.round(s.avg_response_time)}s avg</span>}
                        </div>
                      </div>
                      <Link href={`/history/${s.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold border border-primary/20 hover:bg-primary/20 transition shrink-0">
                        <BookOpen className="w-4 h-4" /> Lihat Detail
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== PROFILE ===== */}
          {tab === 'profile' && (
            <div className="max-w-5xl mx-auto w-full space-y-8 pb-12">
              <h1 className="text-3xl font-bold font-heading text-on-surface">Profil Saya</h1>
              <div className="flex flex-col gap-6">
                
                {/* ROW 1: Foto Profil (Col 12) */}
                <div className="glass-card rounded-3xl border border-surface-container-highest shadow-sm overflow-hidden relative">
                  {/* Cover Banner */}
                  <div className="h-32 w-full bg-gradient-to-r from-primary/30 via-accent/20 to-primary/10 relative">
                    <div className="absolute inset-0 backdrop-blur-[2px] bg-surface-container/30" />
                  </div>
                  
                  <div className="px-6 md:px-8 pb-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12">
                      <div className="flex items-end gap-5">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl border-4 border-surface-container-lowest text-white text-4xl md:text-5xl font-bold shrink-0">
                          {profile?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div className="min-w-0 pb-1">
                          <h2 className="text-on-surface font-bold text-2xl md:text-3xl truncate font-heading">{profile?.full_name || 'Memuat...'}</h2>
                          <p className="text-on-surface-variant text-sm truncate mt-0.5">{profile?.email || '-'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row md:items-center gap-3 shrink-0">
                        {profile?.role && (
                          <div className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low border border-surface-container-highest text-sm font-semibold shadow-sm ${ROLE_META[profile.role]?.color}`}>
                            <span>{ROLE_META[profile.role]?.emoji}</span>
                            <span>{ROLE_META[profile.role]?.label}</span>
                          </div>
                        )}
                        <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-semibold transition border border-outline-variant/30 shadow-sm">
                          <Camera className="w-4 h-4 text-outline" /> <span className="hidden sm:inline">Ubah Avatar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROW 2: Kesiapan Mental (Kiri) & Ubah Peran (Kanan) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Kesiapan Mental */}
                  <div className="glass-card p-6 rounded-3xl border border-primary/20 space-y-5 shadow-sm h-full">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      Ringkasan Kesiapan Mental
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-container rounded-2xl p-4 border border-surface-container-highest text-center">
                        <p className="text-on-surface-variant text-xs mb-1">Total Sesi</p>
                        <p className="text-4xl font-bold text-on-surface">{sessions.length}</p>
                        <p className="text-outline text-xs mt-1">Diselesaikan</p>
                      </div>
                      <div className="bg-surface-container rounded-2xl p-4 border border-surface-container-highest text-center">
                        <p className="text-on-surface-variant text-xs mb-1">Rata-rata Skor</p>
                        <p className="text-4xl font-bold text-secondary">{avgScore !== null ? `${avgScore}%` : '—'}</p>
                        <p className="text-outline text-xs mt-1">Kesiapan Kerja</p>
                      </div>
                    </div>
                    <div className="bg-surface-container rounded-2xl p-5 border border-surface-container-highest space-y-3">
                      <p className="text-primary text-xs font-bold flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Kesimpulan AI</p>
                      <p className="text-on-surface-variant text-sm leading-relaxed">
                        {sessions.length === 0
                          ? 'Belum ada data. Selesaikan minimal 1 sesi simulasi untuk mendapatkan analisis kesiapan kerjamu.'
                          : sessions.length < 5
                          ? `Kamu baru memulai dengan ${sessions.length} sesi. Terus berlatih!`
                          : `Dengan ${sessions.length} sesi, kamu berada di jalur yang sangat baik. Pertahankan konsistensi!`}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-on-surface-variant">
                        <span>Progress Kesiapan</span>
                        <span>{Math.min(sessions.length * 7, 100)}%</span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-2">
                        <div className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                          style={{ width: `${Math.min(sessions.length * 7, 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Ubah Peran */}
                  <div className="glass-card p-6 rounded-3xl border border-surface-container-highest space-y-4 shadow-sm h-full flex flex-col">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-outline">
                      Ubah Peran Saya
                    </h2>
                    <p className="text-outline text-xs">Ganti peran untuk menyesuaikan kategori skenario yang tampil di dasbor.</p>
                    <div className="grid grid-cols-1 gap-2 flex-1">
                      {Object.entries(ROLE_META).map(([key, meta]) => (
                        <button key={key} onClick={() => handleChangeRole(key)} disabled={roleLoading || profile?.role === key}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition ${profile?.role === key ? 'border-primary bg-primary/10 text-primary' : 'border-surface-container-highest text-on-surface-variant hover:border-outline hover:text-on-surface'}`}>
                          {roleLoading && profile?.role !== key ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-base">{meta.emoji}</span>}
                          <span>{meta.label}</span>
                          {profile?.role === key && <span className="ml-auto text-xs bg-primary/20 px-2 py-0.5 rounded-full">Aktif</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ROW 3: Ganti Kata Sandi & Logout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="glass-card p-6 rounded-3xl border border-surface-container-highest space-y-4 shadow-sm h-full">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" /> Ganti Kata Sandi
                    </h2>
                    <input type="password" placeholder="Kata sandi baru (min. 6 karakter)"
                      className="w-full bg-surface-container border border-surface-container-highest text-on-surface rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary outline-none transition text-sm mb-2"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <button onClick={handleChangePassword} disabled={pwLoading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm mt-auto">
                      {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Perbarui Kata Sandi
                    </button>
                  </div>

                  <div className="glass-card p-6 rounded-3xl border border-error/20 space-y-4 shadow-sm h-full flex flex-col justify-center">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-error">Zona Berbahaya</h2>
                    <p className="text-outline text-xs mb-2">Keluar dari perangkat ini. Anda harus masuk kembali untuk mengakses sesi latihan Anda.</p>
                    <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}
                      className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition mt-auto">
                      Keluar dari Akun
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
