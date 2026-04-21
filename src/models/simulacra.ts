// Struktur Model Database Utama Simulacra
export interface Category {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  scenarios?: Scenario[];
}

export interface Scenario {
  id: string;
  category_id: string;
  title: string;
  level: string;
  color: string;
  system_prompt?: string; // Seringkali dirahasiakan ke backend API route saja
}

export interface SessionResult {
  id: string;
  user_name: string;
  scenario_name: string;
  patience_score: number;
  clarity_score: number;
}
