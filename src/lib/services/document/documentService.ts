import { supabase } from '@/lib/supabase';
import type { Invoice, Quote, DocumentItem } from '@/types/document';

export async function createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }

  return data.id;
}

export async function createQuote(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data, error } = await supabase
    .from('quotes')
    .insert(quote)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating quote:', error);
    throw error;
  }

  return data.id;
}

export async function addDocumentItems(items: Omit<DocumentItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
  const { error } = await supabase
    .from('document_items')
    .insert(items);

  if (error) {
    console.error('Error adding document items:', error);
    throw error;
  }
}

export async function getDocumentItems(documentType: 'invoice' | 'quote', documentId: string): Promise<DocumentItem[]> {
  const { data, error } = await supabase
    .from('document_items')
    .select('*')
    .eq('document_type', documentType)
    .eq('document_id', documentId);

  if (error) {
    console.error('Error fetching document items:', error);
    throw error;
  }

  return data || [];
}

export async function updateDocumentStatus(
  documentType: 'invoice' | 'quote',
  documentId: string,
  status: string
): Promise<void> {
  const table = documentType === 'invoice' ? 'invoices' : 'quotes';
  
  const { error } = await supabase
    .from(table)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', documentId);

  if (error) {
    console.error(`Error updating ${documentType} status:`, error);
    throw error;
  }
}