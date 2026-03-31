import { supabase } from './supabase';

// Re-export the main supabase client — the old separate project no longer exists
export const supabaseInvoices = supabase;