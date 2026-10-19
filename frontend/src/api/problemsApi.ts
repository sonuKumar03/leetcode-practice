import { apiRequest } from './client';
import type { Problem, ProblemListResponse, NewProblemPayload, Status } from '../types';

export interface GetProblemsParams {
  tag?: string;
  difficulty?: string;
  status?: string;
  search?: string;
  search_notes?: boolean;
  is_starred?: boolean;
  paid_only?: boolean;
  sort_by?: string;
  page?: number;
  page_size?: number;
}

export const problemsApi = {
  getProblems: (params: GetProblemsParams): Promise<ProblemListResponse> => {
    const query = new URLSearchParams();
    if (params.tag) query.set('tag', params.tag);
    if (params.difficulty && params.difficulty !== 'All') query.set('difficulty', params.difficulty);
    if (params.status && params.status !== 'All') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.search_notes) query.set('search_notes', 'true');
    if (params.is_starred) query.set('is_starred', 'true');
    if (params.paid_only !== undefined) query.set('paid_only', String(params.paid_only));
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));

    return apiRequest<ProblemListResponse>(`/api/v1/problems?${query.toString()}`);
  },

  getProblemById: (id: string): Promise<Problem> => {
    return apiRequest<Problem>(`/api/v1/problems/${id}`);
  },

  lookupMetadata: (
    query: string
  ): Promise<{
    id: string;
    title: string;
    difficulty: any;
    leetcode_url: string;
    tags: string[];
    company_tags: string[];
    source: string;
  }> => {
    return apiRequest(`/api/v1/problems/lookup?query=${encodeURIComponent(query)}`);
  },

  createProblem: (payload: NewProblemPayload): Promise<Problem> => {
    return apiRequest<Problem>('/api/v1/problems', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTracking: (
    id: string,
    data: { status?: Status; is_starred?: boolean; notes?: string }
  ): Promise<{ problem_id: string; status: Status; is_starred: boolean; notes: string }> => {
    return apiRequest(`/api/v1/problems/${id}/tracking`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  batchUpdateTracking: (
    items: Array<{ id: string; status?: Status; is_starred?: boolean; notes?: string }>
  ): Promise<{ updated: number }> => {
    return apiRequest('/api/v1/problems/tracking/batch', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },
};
