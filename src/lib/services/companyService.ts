import { supabase } from '../supabase';
import type { Company } from '@/types/company';

export async function deleteCompany(company: Company): Promise<void> {
  try {
    // Delete the company (cascade will handle related records)
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', company.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Delete company error:', error);
    throw error;
  }
}