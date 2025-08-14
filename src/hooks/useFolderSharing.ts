import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { FolderShare } from '@/types/file';

export function useFolderSharing(folderId: string) {
  const [shares, setShares] = useState<FolderShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShares() {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('folder_shares')
          .select('*')
          .eq('folder_id', folderId);
        
        if (err) throw err;
        
        setShares(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching shares:', err);
        setError('Erreur lors du chargement des partages');
      } finally {
        setLoading(false);
      }
    }

    fetchShares();
  }, [folderId]);

  const addShare = async (email: string, role: 'viewer' | 'editor') => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) throw userError;

      const { error: shareError } = await supabase
        .from('folder_shares')
        .insert({
          folder_id: folderId,
          user_id: userData.id,
          role
        });

      if (shareError) throw shareError;

      const newShare: FolderShare = {
        email,
        role,
        sharedAt: new Date()
      };
      setShares([...shares, newShare]);
    } catch (err) {
      console.error('Error adding share:', err);
      throw err;
    }
  };

  const removeShare = async (email: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) throw userError;

      const { error: shareError } = await supabase
        .from('folder_shares')
        .delete()
        .eq('folder_id', folderId)
        .eq('user_id', userData.id);

      if (shareError) throw shareError;

      setShares(shares.filter(s => s.email !== email));
    } catch (err) {
      console.error('Error removing share:', err);
      throw err;
    }
  };

  const updateShareRole = async (email: string, newRole: 'viewer' | 'editor') => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError) throw userError;

      const { error: shareError } = await supabase
        .from('folder_shares')
        .update({ role: newRole })
        .eq('folder_id', folderId)
        .eq('user_id', userData.id);

      if (shareError) throw shareError;

      setShares(shares.map(share => 
        share.email === email ? { ...share, role: newRole } : share
      ));
    } catch (err) {
      console.error('Error updating share role:', err);
      throw err;
    }
  };

  return { shares, loading, error, addShare, removeShare, updateShareRole };
}