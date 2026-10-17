import { apiRequest } from './client';
import type { Tag, Stats } from '../types';

export const tagsApi = {
  getTags: (): Promise<Tag[]> => {
    return apiRequest<Tag[]>('/api/v1/tags');
  },

  getStats: (tag?: string): Promise<Stats> => {
    const query = tag ? `?tag=${encodeURIComponent(tag)}` : '';
    return apiRequest<Stats>(`/api/v1/stats${query}`);
  },

  triggerScrape: (): Promise<{ message: string }> => {
    return apiRequest('/api/v1/scrape', { method: 'POST' });
  },
};
