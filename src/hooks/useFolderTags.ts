import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useFolderTags(folderId: string) {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTags() {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('folders')
          .select('tags')
          .eq('id', folderId)
          .single();
        
        if (err) throw err;
        
        setTags(data?.tags || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching tags:', err);
        setError('Erreur lors du chargement des tags');
      } finally {
        setLoading(false);
      }
    }

    fetchTags();
  }, [folderId]);

  const addTag = async (tag: string) => {
    try {
      const { error: err } = await supabase
        .from('folders')
        .update({
          tags: [...tags, tag]
        })
        .eq('id', folderId);

      if (err) throw err;
      setTags([...tags, tag]);
    } catch (err) {
      console.error('Error adding tag:', err);
      throw err;
    }
  };

  const removeTag = async (tag: string) => {
    try {
      const { error: err } = await supabase
        .from('folders')
        .update({
          tags: tags.filter(t => t !== tag)
        })
        .eq('id', folderId);

      if (err) throw err;
      setTags(tags.filter(t => t !== tag));
    } catch (err) {
      console.error('Error removing tag:', err);
      throw err;
    }
  };

  return { tags, loading, error, addTag, removeTag };
}