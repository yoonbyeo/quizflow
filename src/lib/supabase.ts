import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      card_sets: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['card_sets']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['card_sets']['Insert']>;
      };
      cards: {
        Row: {
          id: string;
          set_id: string;
          term: string;
          definition: string;
          hint: string | null;
          position: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cards']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['cards']['Insert']>;
      };
      card_stats: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          correct: number;
          incorrect: number;
          streak: number;
          difficulty: string;
          last_reviewed: string | null;
        };
        Insert: Omit<Database['public']['Tables']['card_stats']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['card_stats']['Insert']>;
      };
    };
  };
};
