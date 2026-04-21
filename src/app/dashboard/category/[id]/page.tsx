'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Play, ChevronRight, Loader2 } from 'lucide-react';

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmScenario, setConfirmScenario] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data: cat } = await supabase.from('categories').select('*').eq('id', categoryId).single();
      const { data: sc } = await supabase.from('scenarios').select('id, title, level, color').eq('category_id', categoryId).order('created_at');
      setCategory(cat);
      setScenarios(sc || []);
      setLoading(false);
    }
    if (categoryId) load();
  }, [categoryId]);

  const handleStart = (scenario: any) => setConfirmScenario(scenario);

  const confirmStart = () => {
    if (!confirmScenario) return;
    router.push(`/simulator?id=${confirmScenario.id}`);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-10">
      {/* Confirm Modal */}
      {confirmScenario && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-white mb-2">Mulai Sesi Ini?</h2>
              <p className="text-slate-400 text-sm">Kamu akan masuk ke skenario:</p>
              <p className="text-white font-semibold mt-2 text-lg">"{confirmScenario.title}"</p>
              <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${confirmScenario.color}`}>
                {confirmScenario.level}
              </span>
            </div>
            <p className="text-slate-500 text-xs">AI akan mengawali percakapan. Pastikan mikrofon atau keyboard siap.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmScenario(null)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition">
                Batal
              </button>
              <button onClick={confirmStart} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition shadow-lg">
                Ya, Mulai!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => router.push('/dashboard')} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold font-heading text-white">{category?.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{category?.description}</p>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scene, i) => (
          <button
            key={scene.id}
            onClick={() => handleStart(scene)}
            className="glass-card border border-white/5 hover:border-white/20 rounded-2xl p-5 text-left flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <p className="text-white font-semibold group-hover:text-primary transition-colors">{scene.title}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${scene.color}`}>{scene.level}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </button>
        ))}

        {scenarios.length === 0 && (
          <div className="col-span-2 text-center text-slate-500 py-20 italic">
            Belum ada skenario untuk kategori ini. Tambahkan via SQL Supabase.
          </div>
        )}
      </div>
    </div>
  );
}
