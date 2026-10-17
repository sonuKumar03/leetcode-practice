-- SQLite schema for LeetCode Practice Tracker

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard', 'Unknown')) DEFAULT 'Unknown',
    paid_only INTEGER DEFAULT 0,
    leetcode_url TEXT,
    doocs_url TEXT,
    source TEXT DEFAULT 'doocs', -- 'doocs' or 'custom'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT CHECK(type IN ('topic', 'company')) DEFAULT 'topic'
);

CREATE TABLE IF NOT EXISTS problem_tags (
    problem_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (problem_id, tag_id),
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_tracking (
    problem_id TEXT PRIMARY KEY,
    status TEXT CHECK(status IN ('todo', 'in_progress', 'solved')) DEFAULT 'todo',
    is_starred INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

-- Indexes for lightning fast search and filtering
-- 1. Problems table indexes
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_title ON problems(title);
CREATE INDEX IF NOT EXISTS idx_problems_title_lower ON problems(LOWER(title));
CREATE INDEX IF NOT EXISTS idx_problems_slug ON problems(slug);
CREATE INDEX IF NOT EXISTS idx_problems_paid_only ON problems(paid_only);
CREATE INDEX IF NOT EXISTS idx_problems_diff_paid ON problems(difficulty, paid_only);
CREATE INDEX IF NOT EXISTS idx_problems_id_numeric ON problems(CAST(id AS INTEGER), id);

-- 2. Tags table indexes
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(type);
CREATE INDEX IF NOT EXISTS idx_tags_name_lower ON tags(LOWER(name));

-- 3. Problem-Tags association covering indexes
CREATE INDEX IF NOT EXISTS idx_problem_tags_tag ON problem_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_problem_tags_tag_problem ON problem_tags(tag_id, problem_id);

-- 4. User Tracking indexes
CREATE INDEX IF NOT EXISTS idx_user_tracking_status ON user_tracking(status);
CREATE INDEX IF NOT EXISTS idx_user_tracking_starred ON user_tracking(is_starred);
CREATE INDEX IF NOT EXISTS idx_user_tracking_status_starred ON user_tracking(status, is_starred);
CREATE INDEX IF NOT EXISTS idx_user_tracking_cover ON user_tracking(problem_id, status, is_starred);
