import { FileItem } from '@/types/file';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: FileItem[]; timestamp: number }>();

export const fileCache = {
  set(key: string, data: FileItem[]) {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  },

  get(key: string): FileItem[] | null {
    const entry = cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
    if (isExpired) {
      cache.delete(key);
      return null;
    }

    return entry.data;
  },

  clear() {
    cache.clear();
  },

  invalidate(key: string) {
    cache.delete(key);
  }
};