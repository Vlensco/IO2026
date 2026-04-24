import { supabase } from '@/lib/supabase';
import { Category, Scenario } from '@/models/simulacra';

export async function fetchCategoriesWithScenarios(): Promise<Category[]> {
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (catError) throw new Error(catError.message);

  const { data: scenarios, error: sceError } = await supabase
    .from('scenarios')
    .select('id, category_id, title, level, color'); // Jangan tarik prompt rahasia ke klien!

  if (sceError) throw new Error(sceError.message);

  // Menggabungkan (Join) Scenarios ke dalam Kategorinya masing-masing
  const completeCategories = categories.map((cat: any) => ({
    ...cat,
    scenarios: scenarios.filter((s: any) => s.category_id === cat.id)
  }));

  return completeCategories;
}

export async function fetchSystemPromptById(scenarioId: string): Promise<{prompt: string, title: string, category: string}> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('system_prompt, title, categories(title)')
    .eq('id', scenarioId)
    .single();
    
  if (error || !data) {
    return {
      prompt: 'Anda adalah karakter AI standar. Balas dengan maksimal 2 kalimat.',
      title: 'Skenario Default',
      category: 'Kategori Default'
    };
  }
  
  return {
    prompt: data.system_prompt,
    title: data.title || '',
    category: (data.categories as any)?.title || ''
  };
}
