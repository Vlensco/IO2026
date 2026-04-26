'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail, Lock, User, Phone, ArrowRight, Sparkles, ArrowLeft,
  CheckCircle2, XCircle, GraduationCap, BookOpen, Briefcase, ArrowRightCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type UserRole = 'siswa_sma' | 'mahasiswa' | 'pekerja';
type AuthStep = 'form' | 'role_select';

const ROLE_OPTIONS: { key: UserRole; icon: any; label: string; desc: string; tags: string[]; color: string; gradient: string }[] = [
  {
    key: 'siswa_sma',
    icon: GraduationCap,
    label: 'Siswa SMA / SMK',
    desc: 'Pelajar tingkat menengah atas yang mempersiapkan diri menghadapi dunia kerja dan karir pertama.',
    tags: ['Presentasi Kelas', 'Wawancara Beasiswa', 'OSIS & Kepemimpinan'],
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    key: 'mahasiswa',
    icon: BookOpen,
    label: 'Mahasiswa',
    desc: 'Mahasiswa aktif yang butuh persiapan sidang skripsi, magang, dan transisi ke dunia profesional.',
    tags: ['Sidang Skripsi', 'Interview Magang', 'Presentasi Proyek'],
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-indigo-500/20',
  },
  {
    key: 'pekerja',
    icon: Briefcase,
    label: 'Profesional / Pekerja',
    desc: 'Karyawan atau profesional yang ingin meningkatkan kemampuan komunikasi di lingkungan kerja.',
    tags: ['Negosiasi Klien', 'Manajemen Konflik', 'Meeting & Presentasi'],
    color: 'text-violet-400',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<AuthStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({ show: false, msg: '', type: 'success' });

  const notify = (msg: string, type: 'success' | 'error') => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 4500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin) {
      // Registrasi: lanjut ke pilih role
      setStep('role_select');
      return;
    }
    handleLogin();
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      notify('Akses diterima. Membuka pintu Dasbor...', 'success');
      setTimeout(() => window.location.href = '/dashboard', 1000);
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('Invalid login credentials')) msg = 'Email atau sandi yang Anda masukkan keliru.';
      if (msg.includes('Email not confirmed')) msg = 'Email belum dikonfirmasi. Cek inbox/spam kamu.';
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWithRole = async () => {
    if (!selectedRole) { notify('Pilih peran kamu terlebih dahulu!', 'error'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, phone_number: phone, role: selectedRole }
        }
      });
      if (error) throw error;

      // Insert ke user_profiles manual dengan role
      const userId = data.user?.id;
      if (userId) {
        await supabase.from('user_profiles').upsert({
          id: userId,
          full_name: name,
          email,
          phone_number: phone,
          role: selectedRole,
        }, { onConflict: 'id' });
      }

      notify('Akun SIMULOKA berhasil dibuat! Silakan masuk.', 'success');
      setIsLogin(true);
      setStep('form');
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('already registered')) msg = 'Email ini sudah memiliki akun!';
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex min-h-[90vh] bg-surface relative overflow-hidden">

      {/* Toast */}
      <div className={`fixed top-8 right-8 z-[100] transform transition-all duration-500 ease-out flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl max-w-sm ${notif.show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'} ${notif.type === 'error' ? 'bg-red-950/80 border-red-500/50 text-red-100' : 'bg-green-950/80 border-green-500/50 text-green-100'}`}>
        <div className={`p-2 rounded-full ${notif.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {notif.type === 'error' ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
        </div>
        <p className="text-sm font-semibold text-white/90 leading-tight">{notif.msg}</p>
      </div>

      <Link href="/" className="absolute top-6 left-6 z-50 flex items-center text-on-surface hover:text-primary bg-surface-container/80 p-2 rounded-full backdrop-blur-md border border-surface-container-highest transition-all hover:scale-105 shadow-sm">
        <ArrowLeft className="w-6 h-6" />
        <span className="ml-2 pr-2 text-sm font-medium">Kembali</span>
      </Link>

      {/* Left Pane — only on form step */}
      {step === 'form' && (
        <div className="hidden lg:flex flex-1 relative overflow-hidden bg-surface-container-lowest items-center justify-center p-12 border-r border-surface-container-highest">
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse delay-1000" />
          </div>
          <div className="z-10 text-on-surface max-w-lg">
            <Sparkles className="w-16 h-16 text-primary mb-8" />
            <h1 className="text-5xl font-heading font-bold mb-6 leading-tight text-on-surface">
              Levelkan Dirimu. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Real-time AI.</span>
            </h1>
            <p className="text-on-surface-variant text-lg">
              Bergabung dengan 14.500+ pelajar dan profesional yang melatih mental komunikasi mereka dengan SIMULOKA.
            </p>
          </div>
        </div>
      )}

      {/* Right Pane */}
      <div className={`${step === 'role_select' ? 'w-full' : 'flex-1'} flex flex-col items-center justify-center p-6 relative z-10`}>

        {/* ===== STEP 1: LOGIN / REGISTER FORM ===== */}
        {step === 'form' && (
          <div className="w-full max-w-md space-y-8 glass-card p-10 rounded-3xl border border-surface-container shadow-xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold font-heading text-on-surface">
                {isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}
              </h2>
              <p className="text-on-surface-variant mt-2">
                {isLogin ? 'Masuk untuk melanjutkan rute simulasimu.' : 'Dapatkan akses ke ekosistem SIMULOKA.'}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5 mt-8">
              {!isLogin && (
                <>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                    <input type="text" required placeholder="Nama Lengkap"
                      className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition shadow-sm"
                      value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                    <input type="tel" required placeholder="Nomor Telepon (HP)"
                      className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition shadow-sm"
                      value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input type="email" required placeholder="Alamat Email"
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition shadow-sm"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input type="password" required placeholder="Kata Sandi"
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition shadow-sm"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>

              <button disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 shadow-lg shadow-primary/20 flex justify-center items-center gap-2 transition disabled:opacity-50 relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Memproses...
                    </>
                  ) : isLogin ? 'Masuk ke Simulator' : (
                    <><span>Lanjut — Pilih Peranmu</span><ArrowRightCircle className="w-5 h-5" /></>
                  )}
                </span>
                <div className="absolute inset-0 h-full w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full z-0" />
              </button>
            </form>

            <div className="text-center mt-6">
              <button onClick={() => { setIsLogin(!isLogin); setStep('form'); }}
                className="text-sm text-outline hover:text-primary transition">
                {isLogin ? 'Belum punya akun? Daftar gratis.' : 'Sudah punya akun? Masuk di sini.'}
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 2: PILIH ROLE ===== */}
        {step === 'role_select' && (
          <div className="w-full max-w-4xl space-y-8 z-10">
            {/* Back to form */}
            <button onClick={() => setStep('form')}
              className="flex items-center gap-2 text-outline hover:text-primary transition text-sm">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>

            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Langkah 2 dari 2
              </div>
              <h2 className="text-4xl font-bold font-heading text-on-surface">Siapa Kamu Sekarang?</h2>
              <p className="text-on-surface-variant max-w-xl mx-auto">
                Pilih peranmu agar SIMULOKA dapat menyesuaikan skenario latihan yang paling relevan untukmu.
              </p>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {ROLE_OPTIONS.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.key;
                return (
                  <button
                    key={role.key}
                    onClick={() => setSelectedRole(role.key)}
                    className={`relative text-left rounded-3xl p-6 border-2 transition-all duration-300 space-y-4 group ${
                      isSelected
                        ? `border-primary bg-gradient-to-br ${role.gradient} shadow-2xl shadow-primary/20 scale-105`
                        : 'border-surface-container-highest bg-surface-container-lowest hover:border-primary/50 hover:scale-102 shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${role.gradient} border border-white/20 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 h-7 ${role.color}`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold font-heading mb-2 ${isSelected ? 'text-on-surface' : 'text-on-surface'}`}>{role.label}</h3>
                      <p className={`text-sm leading-relaxed ${isSelected ? 'text-on-surface/80' : 'text-on-surface-variant'}`}>{role.desc}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {role.tags.map(tag => (
                        <span key={tag} className={`text-xs px-2.5 py-1 rounded-full ${isSelected ? 'bg-white/20 text-on-surface' : 'bg-surface-container border border-surface-container-highest text-on-surface-variant'} font-medium`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleRegisterWithRole}
                disabled={!selectedRole || loading}
                className="px-12 py-4 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-bold text-lg hover:opacity-90 disabled:opacity-40 transition shadow-xl shadow-primary/30 flex items-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Membuat Akun...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Buat Akun SIMULOKA
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
