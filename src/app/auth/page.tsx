'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Phone, ArrowRight, Sparkles, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{ show: boolean, msg: string, type: 'success' | 'error' }>({ show: false, msg: '', type: 'success' });

  // Custom Notifikasi Canggih
  const notify = (msg: string, type: 'success' | 'error') => {
    setNotif({ show: true, msg, type });
    setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 4500); // Hilang dalam 4.5 detik
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        notify('Akses diterima. Membuka pintu Dasbor...', 'success');
        setTimeout(() => window.location.href = '/dashboard', 1000);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, phone_number: phone } }
        });
        if (error) throw error;
        notify('Registrasi sukses! Akun Simulacra Anda telah tercetak.', 'success');
        setIsLogin(true);
      }
    } catch (error: any) {
      let errorMsg = error.message;
      if (errorMsg.includes('Invalid login credentials')) errorMsg = 'Email atau sandi yang Anda masukkan keliru.';
      if (errorMsg.includes('already registered')) errorMsg = 'Ups, alamat email ini sudah mempunyai akun!';
      
      notify(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex min-h-[90vh] bg-[#0f172a] relative overflow-hidden">
      
      {/* Toast Notification (SweetAlert UI Style) */}
      <div 
        className={`fixed top-8 right-8 z-[100] transform transition-all duration-500 ease-out flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl max-w-sm ${notif.show ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-95 pointer-events-none'} ${notif.type === 'error' ? 'bg-red-950/80 border-red-500/50 text-red-100' : 'bg-green-950/80 border-green-500/50 text-green-100'}`}
      >
        <div className={`p-2 rounded-full ${notif.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {notif.type === 'error' ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
        </div>
        <p className="text-sm font-semibold text-white/90 leading-tight">{notif.msg}</p>
      </div>

      <Link href="/" className="absolute top-6 left-6 z-50 flex items-center text-slate-400 hover:text-white bg-slate-900/50 p-2 rounded-full backdrop-blur-md border border-slate-700/50 transition-all hover:scale-105">
        <ArrowLeft className="w-6 h-6" />
        <span className="ml-2 pr-2 text-sm font-medium">Kembali</span>
      </Link>
      
      {/* Left Pane (Image / Creative Art) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-950 items-center justify-center p-12">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[120px] animate-pulse delay-1000" />
        </div>
        
        <div className="z-10 text-white max-w-lg">
          <Sparkles className="w-16 h-16 text-primary mb-8" />
          <h1 className="text-5xl font-heading font-bold mb-6 leading-tight">
            Levelkan Dirimu. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Real-time AI.</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Bergabung dengan 14.500+ siswa vokasi lainnya yang telah mematahkan batas wawasan dan melatih mental kerja mereka.
          </p>
        </div>
      </div>

      {/* Right Pane (Form) */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 w-full">
        <div className="w-full max-w-md space-y-8 glass-card p-10 rounded-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold font-heading text-white">
              {isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}
            </h2>
            <p className="text-slate-400 mt-2">
              {isLogin ? 'Masuk untuk melanjutkan rute simulasimu.' : 'Dapatkan akses ke ekosistem Simulacra.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5 mt-8">
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    placeholder="Nama Lengkap" 
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition"
                    value={name} onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input 
                    type="tel" 
                    required
                    placeholder="Nomor Telepon (HP)" 
                    className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition"
                    value={phone} onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                required
                placeholder="Alamat Email" 
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                required
                placeholder="Kata Sandi" 
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary outline-none transition"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button disabled={loading} className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 shadow-lg shadow-primary/20 flex justify-center items-center gap-2 transition disabled:opacity-50 relative overflow-hidden group">
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Memproses...
                  </>
                ) : (isLogin ? 'Masuk ke Simulator' : 'Daftar Sekarang')}
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </span>
              <div className="absolute inset-0 h-full w-0 bg-white/20 transition-all duration-300 ease-out group-hover:w-full z-0"></div>
            </button>
          </form>

          <div className="text-center mt-6">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-slate-400 hover:text-white transition">
              {isLogin ? 'Belum punya akun? Daftar gratis.' : 'Sudah punya akun? Masuk di sini.'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
