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

export async function updateTreasuryAdjustment(
  companyId: string,
  adjustment: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('companies')
      .update({ treasury_adjustment: adjustment })
      .eq('id', companyId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Update treasury adjustment error:', error);
    throw error;
  }
}

export async function getTreasuryAdjustment(
  companyId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('treasury_adjustment')
      .eq('id', companyId)
      .single();

    if (error) {
      throw error;
    }

    return data?.treasury_adjustment || 0;
  } catch (error) {
    console.error('Get treasury adjustment error:', error);
    return 0;
  }
}