import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ibahrcapvqfjoacweyxg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliYWhyY2FwdnFmam9hY3dleXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NTMxODUsImV4cCI6MjA1MzEyOTE4NX0.ENmz9X1-7EfThjaPl3UUcxrb3Kbs0xPOROIX9i7ATQw';

export const supabaseInvoices = createClient(supabaseUrl, supabaseAnonKey);