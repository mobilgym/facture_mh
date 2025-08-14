import { supabase } from '@/lib/supabase';
import type { CompanySettings } from '@/types/document';

export async function getCompanySettings(companyId: string): Promise<CompanySettings | null> {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error) {
    console.error('Error fetching company settings:', error);
    throw error;
  }

  return data;
}

export async function updateCompanySettings(settings: Partial<CompanySettings>): Promise<void> {
  const { error } = await supabase
    .from('company_settings')
    .upsert({
      ...settings,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating company settings:', error);
    throw error;
  }
}