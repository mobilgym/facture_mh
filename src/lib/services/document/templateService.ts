import { supabase } from '@/lib/supabase';
import type { DocumentTemplate } from '@/types/document';

export async function getTemplates(companyId: string, type?: 'invoice' | 'quote'): Promise<DocumentTemplate[]> {
  let query = supabase
    .from('document_templates')
    .select('*')
    .eq('company_id', companyId);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }

  return data || [];
}

export async function createTemplate(template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data, error } = await supabase
    .from('document_templates')
    .insert(template)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating template:', error);
    throw error;
  }

  return data.id;
}

export async function updateTemplate(
  templateId: string,
  updates: Partial<Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const { error } = await supabase
    .from('document_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId);

  if (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('document_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}