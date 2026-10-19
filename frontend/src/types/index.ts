export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Unknown';
export type Status = 'todo' | 'in_progress' | 'solved';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  paid_only: boolean;
  leetcode_url: string;
  doocs_url: string;
  source: 'doocs' | 'custom';
  frequency?: number;
  tags: string[];
  status: Status;
  is_starred: boolean;
  notes: string;
  updated_at?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  type?: 'topic' | 'company';
  problem_count: number;
}

export interface Stats {
  total_problems: number;
  solved_problems: number;
  in_progress_problems: number;
  todo_problems: number;
  starred_problems: number;
  completion_percentage: number;
  easy_total: number;
  easy_solved: number;
  medium_total: number;
  medium_solved: number;
  hard_total: number;
  hard_solved: number;
  current_streak: number;
  tag_name?: string;
  tag_total?: number;
  tag_solved?: number;
}

export interface ProblemListResponse {
  items: Problem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface NewProblemPayload {
  id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  company_tags?: string[];
  leetcode_url?: string;
  doocs_url?: string;
  notes?: string;
}
