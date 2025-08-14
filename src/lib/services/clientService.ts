import { supabase } from '@/lib/supabase';
import type { Client } from '@/types/client';

export async function getClients(companyId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('company_id', companyId)
    .order('name');

  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }

  return data || [];
}

export async function createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }

  return data.id;
}

export async function updateClient(
  clientId: string,
  updates: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', clientId);

  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }
}

export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
}