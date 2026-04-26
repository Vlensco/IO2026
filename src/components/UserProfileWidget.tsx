'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Activity, Target, ShieldCheck, History } from 'lucide-react';

export default function UserProfileWidget() {
  const [profile, setProfile] = useState<any>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [readiness, setReadiness] = useState(0);

  useEffect(() => {
    async function fetchUserData() {
      // Menarik JWT Token asli bawaan user di Browser (Aman & Tidak Terkoneksi Database Secara Langsung)
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      
      if (!user) return;

      // Fitur Keamanan: Permintaan Supabase dijalankan via PostgREST API (Bebas SQL Injection murni)
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
        
      if (profileData) setProfile(profileData);

      const { data: sessions } = await supabase
        .from('sessions')
        .select('patience_score, clarity_score')
        .eq('user_id', user.id); // RLS Database yang menolak user mengakses data id lain

      if (sessions && sessions.length > 0) {
        setHistoryCount(sessions.length);
        let totalScore = 0;
        sessions.forEach((s: any) => totalScore += ((s.patience_score + s.clarity_score) / 2));
        setReadiness(Math.round(totalScore / sessions.length));
      } else {
        setReadiness(0); 
      }
    }
    
    fetchUserData();
  }, []);

  if (!profile) return (
    <div className="h-24 w-full bg-surface-container-high/30 rounded-3xl animate-pulse mb-8 border border-surface-container-highest"></div>
  );

  return (
    <div className="glass-card mb-8 p-6 rounded-3xl border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
      {/* Label Keamanan */}
      <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-bl-xl flex items-center gap-1 font-bold">
        <ShieldCheck className="w-3 h-3" /> Dilindungi RLS & PostgREST API
      </div>

      <div className="flex items-center gap-4 z-10 w-full md:w-auto">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-heading text-on-surface">{profile.full_name || 'Agen SIMULOKA'}</h2>
          <p className="text-on-surface-variant text-sm">{profile.email}</p>
        </div>
      </div>

      <div className="flex gap-4 md:gap-8 w-full md:w-auto z-10">
        <div className="bg-surface-container px-6 py-3 rounded-2xl border border-surface-container-highest flex flex-col justify-center">
          <div className="flex items-center space-x-2 text-outline text-xs font-bold uppercase tracking-wider mb-1">
            <History className="w-4 h-4" /> <span>Riwayat Ujian</span>
          </div>
          <p className="text-2xl font-bold text-on-surface">{historyCount} <span className="text-sm font-normal text-outline">Skenario</span></p>
        </div>

        <div className="bg-surface-container px-6 py-3 rounded-2xl border border-surface-container-highest flex flex-col justify-center">
          <div className="flex items-center space-x-2 text-secondary text-xs font-bold uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" /> <span>Kesiapan Mental</span>
          </div>
          <p className="text-2xl font-bold text-on-surface">{readiness}% <span className="text-sm font-normal text-outline">Avg</span></p>
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
    </div>
  );
}
