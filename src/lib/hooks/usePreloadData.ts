import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFiles } from './useFiles';
import { useFolders } from './useFolders';

export function usePreloadData() {
  const location = useLocation();
  const { prefetchFiles } = useFiles();
  const { prefetchFolders } = useFolders();

  useEffect(() => {
    const preloadData = async () => {
      if (location.pathname === '/') {
        await Promise.all([
          prefetchFiles(),
          prefetchFolders()
        ]);
      } else if (location.pathname.startsWith('/folder/')) {
        const folderId = location.pathname.split('/')[2];
        await prefetchFiles({ folderId });
      }
    };

    preloadData();
  }, [location.pathname, prefetchFiles, prefetchFolders]);
}