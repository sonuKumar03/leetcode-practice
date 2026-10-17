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
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_title ON problems(title);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(type);
CREATE INDEX IF NOT EXISTS idx_problem_tags_tag ON problem_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_user_tracking_status ON user_tracking(status);
CREATE INDEX IF NOT EXISTS idx_user_tracking_starred ON user_tracking(is_starred);
