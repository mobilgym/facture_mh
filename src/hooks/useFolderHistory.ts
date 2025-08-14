import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { FolderHistory } from '@/types/file';

export function useFolderHistory(folderId: string) {
  const [history, setHistory] = useState<FolderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const historyQuery = query(
          collection(db, 'folder_history'),
          where('folderId', '==', folderId),
          orderBy('timestamp', 'desc')
        );
        
        const snapshot = await getDocs(historyQuery);
        const historyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FolderHistory[];
        
        setHistory(historyData);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement de l\'historique');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [folderId]);

  return { history, loading, error };
}