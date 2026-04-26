import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Category, Scenario } from '@/models/simulacra';

export async function fetchCategoriesWithScenarios(): Promise<Category[]> {
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (catError) throw new Error(catError.message);

  const { data: scenarios, error: sceError } = await supabase
    .from('scenarios')
    .select('id, category_id, title, level, color');

  if (sceError) throw new Error(sceError.message);

  const completeCategories = categories.map((cat: any) => ({
    ...cat,
    scenarios: scenarios.filter((s: any) => s.category_id === cat.id)
  }));

  return completeCategories;
}

// Gunakan admin client agar bypass RLS — hanya dipanggil dari server-side API route
export async function fetchSystemPromptById(scenarioId: string): Promise<{prompt: string, title: string, category: string}> {
  // Validasi format UUID
  if (!scenarioId || scenarioId === 'customer-angry' || scenarioId === 'interview-hr') {
    console.warn('[DB] scenarioId bukan UUID valid:', scenarioId);
    return getDefaultPrompt(scenarioId);
  }

  const client = supabaseAdmin || supabase; // fallback ke anon jika admin belum dikonfigurasi
  
  const { data, error } = await client
    .from('scenarios')
    .select('system_prompt, title, categories(title)')
    .eq('id', scenarioId)
    .single();
    
  if (error || !data) {
    console.warn('[DB] fetchSystemPromptById error:', error?.message, '| scenarioId:', scenarioId);
    return getDefaultPrompt(scenarioId);
  }

  console.log('[DB] Loaded system_prompt for:', data.title, '| prompt length:', data.system_prompt?.length);
  
  return {
    prompt: data.system_prompt || getDefaultPrompt(scenarioId).prompt,
    title: data.title || '',
    category: (data.categories as any)?.title || ''
  };
}

function getDefaultPrompt(scenarioId: string): {prompt: string, title: string, category: string} {
  // Slug-based fallbacks untuk development
  const fallbacks: Record<string, string> = {
    'customer-angry': 'Anda adalah pelanggan yang sangat marah karena produk rusak. Tuntut pengembalian uang penuh dengan nada tinggi.',
    'interview-hr': 'Anda adalah HRD yang kritis dan skeptis. Tanya dengan pertanyaan tajam soal pengalaman kandidat.',
    'boss-angry': 'Anda adalah atasan yang sangat kecewa karena deadline terlewat. Evaluasi karyawan dengan tegas.',
    'lecturer-strict': 'Anda adalah dosen pembimbing yang perfeksionis. Kritik metodologi skripsi dengan pertanyaan sulit.',
  };
  return {
    prompt: fallbacks[scenarioId] || 'Anda adalah karakter AI yang berperan sesuai skenario. Balas dalam Bahasa Indonesia.',
    title: scenarioId,
    category: 'Umum'
  };
}
