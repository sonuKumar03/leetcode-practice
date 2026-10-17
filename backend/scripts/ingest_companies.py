import os
import glob
import csv
import re
import sqlite3
from typing import Dict, Set

# Mapping of raw slugs to canonical (display_name, canonical_slug)
CANONICAL_COMPANIES = {
    'facebook': ('Meta / Facebook', 'meta'),
    'meta': ('Meta / Facebook', 'meta'),
    'google': ('Google', 'google'),
    'amazon': ('Amazon', 'amazon'),
    'apple': ('Apple', 'apple'),
    'microsoft': ('Microsoft', 'microsoft'),
    'bloomberg': ('Bloomberg', 'bloomberg'),
    'uber': ('Uber', 'uber'),
    'adobe': ('Adobe', 'adobe'),
    'oracle': ('Oracle', 'oracle'),
    'linkedin': ('LinkedIn', 'linkedin'),
    'bytedance': ('ByteDance', 'bytedance'),
    'bytedancetoutiao': ('ByteDance', 'bytedance'),
    'netflix': ('Netflix', 'netflix'),
    'goldman-sachs': ('Goldman Sachs', 'goldman-sachs'),
    'morgan-stanley': ('Morgan Stanley', 'morgan-stanley'),
    'jpmorgan': ('JPMorgan Chase', 'jpmorgan'),
    'jp-morgan-chase': ('JPMorgan Chase', 'jpmorgan'),
    'paypal': ('PayPal', 'paypal'),
    'stripe': ('Stripe', 'stripe'),
    'airbnb': ('Airbnb', 'airbnb'),
    'atlassian': ('Atlassian', 'atlassian'),
    'twitter': ('Twitter (X)', 'twitter'),
    'salesforce': ('Salesforce', 'salesforce'),
    'snapchat': ('Snapchat', 'snapchat'),
    'spotify': ('Spotify', 'spotify'),
    'square': ('Block / Square', 'square'),
    'robinhood': ('Robinhood', 'robinhood'),
    'roblox': ('Roblox', 'roblox'),
    'pinterest': ('Pinterest', 'pinterest'),
    'reddit': ('Reddit', 'reddit'),
    'nvidia': ('NVIDIA', 'nvidia'),
    'intel': ('Intel', 'intel'),
    'cisco': ('Cisco', 'cisco'),
    'citadel': ('Citadel', 'citadel'),
    'two-sigma': ('Two Sigma', 'two-sigma'),
    'jane-street': ('Jane Street', 'jane-street'),
    'de-shaw': ('D.E. Shaw', 'de-shaw'),
    'hulu': ('Hulu', 'hulu'),
    'ebay': ('eBay', 'ebay'),
    'walmart': ('Walmart Labs', 'walmart'),
    'coupang': ('Coupang', 'coupang'),
    'databricks': ('Databricks', 'databricks'),
    'doordash': ('DoorDash', 'doordash'),
    'dropbox': ('Dropbox', 'dropbox'),
    'epic-systems': ('Epic Systems', 'epic-systems'),
    'ibm': ('IBM', 'ibm'),
    'qualcomm': ('Qualcomm', 'qualcomm'),
    'samsung': ('Samsung', 'samsung'),
    'tesla': ('Tesla', 'tesla'),
    'vmware': ('VMware', 'vmware'),
    'yahoo': ('Yahoo', 'yahoo'),
    'yelp': ('Yelp', 'yelp'),
    'zillow': ('Zillow', 'zillow'),
    'booking': ('Booking.com', 'booking'),
    'bookingcom': ('Booking.com', 'booking'),
    'c3-iot': ('C3 AI', 'c3-ai'),
    'c3ai': ('C3 AI', 'c3-ai'),
    'akuna': ('Akuna Capital', 'akuna-capital'),
    'akuna-capital': ('Akuna Capital', 'akuna-capital'),
    'arista': ('Arista Networks', 'arista'),
    'arista-networks': ('Arista Networks', 'arista'),
    'palantir': ('Palantir', 'palantir'),
    'palantir-technologies': ('Palantir', 'palantir'),
    'machine-zone': ('Machine Zone', 'machine-zone'),
    'machinezone': ('Machine Zone', 'machine-zone'),
    'american-express': ('American Express', 'american-express'),
    'capital-one': ('Capital One', 'capital-one'),
    'blackrock': ('BlackRock', 'blackrock'),
    'barclays': ('Barclays', 'barclays'),
    'deutsche-bank': ('Deutsche Bank', 'deutsche-bank'),
    'cruise-automation': ('Cruise', 'cruise'),
    'electronic-arts': ('EA (Electronic Arts)', 'electronic-arts'),
    'f5-networks': ('F5 Networks', 'f5-networks'),
    'pure-storage': ('Pure Storage', 'pure-storage'),
    'united-health-group': ('UnitedHealth Group', 'united-health-group'),
    'works-applications': ('Works Applications', 'works-applications'),
}

def normalize_company(raw_slug: str):
    if raw_slug in CANONICAL_COMPANIES:
        return CANONICAL_COMPANIES[raw_slug]
    # Default prettify: "akuna-capital" -> ("Akuna Capital", "akuna-capital")
    clean_name = raw_slug.replace('-', ' ').title()
    return (clean_name, raw_slug)

def main():
    data_dir = '/tmp/leetcode_company_data'
    db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'leetcode.db')
    db_path = os.path.abspath(db_path)

    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Step 1: Ensure tags table has 'type' column
    cursor.execute("PRAGMA table_info(tags);")
    columns = [row[1] for row in cursor.fetchall()]
    if 'type' not in columns:
        print("Adding 'type' column to tags table...")
        cursor.execute("ALTER TABLE tags ADD COLUMN type TEXT DEFAULT 'topic';")
        cursor.execute("UPDATE tags SET type = 'topic' WHERE type IS NULL;")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(type);")
        conn.commit()

    # Get existing problem IDs
    cursor.execute("SELECT id FROM problems;")
    existing_problem_ids = set(row[0] for row in cursor.fetchall())
    print(f"Loaded {len(existing_problem_ids)} existing problem IDs from database.")

    # Step 2: Read CSVs and group problem IDs by canonical company
    files = glob.glob(os.path.join(data_dir, '*.csv'))
    print(f"Found {len(files)} CSV files in {data_dir}.")

    company_questions: Dict[str, Set[str]] = {}
    company_names: Dict[str, str] = {}

    for f in files:
        fname = os.path.basename(f)
        m = re.match(r'^(.*?)_(6months|1year|2year|alltime)\.csv$', fname)
        if not m:
            continue
        raw_slug = m.group(1)
        display_name, canonical_slug = normalize_company(raw_slug)

        company_names[canonical_slug] = display_name
        company_questions.setdefault(canonical_slug, set())

        with open(f, mode='r', encoding='utf-8', errors='ignore') as csvfile:
            reader = csv.reader(csvfile)
            next(reader, None) # skip header
            for row in reader:
                if row and row[0].strip().isdigit():
                    pid = row[0].strip()
                    if pid in existing_problem_ids:
                        company_questions[canonical_slug].add(pid)

    print(f"Aggregated {len(company_questions)} unique canonical companies.")

    # Step 3: Insert company tags and problem_tags into SQLite
    cursor.execute("BEGIN TRANSACTION;")
    try:
        tag_id_map = {}
        for slug, name in company_names.items():
            cursor.execute(
                """
                INSERT INTO tags (name, slug, type)
                VALUES (?, ?, 'company')
                ON CONFLICT(slug) DO UPDATE SET
                    name = excluded.name,
                    type = 'company'
                RETURNING id;
                """,
                (name, slug)
            )
            tag_id = cursor.fetchone()[0]
            tag_id_map[slug] = tag_id

        # Insert problem_tags links
        total_links = 0
        for slug, pids in company_questions.items():
            tag_id = tag_id_map[slug]
            for pid in pids:
                cursor.execute(
                    "INSERT OR IGNORE INTO problem_tags (problem_id, tag_id) VALUES (?, ?);",
                    (pid, tag_id)
                )
                total_links += 1

        conn.commit()
        print(f"Successfully inserted/updated {len(tag_id_map)} company tags!")
        print(f"Processed {total_links} problem-company associations.")

    except Exception as e:
        conn.rollback()
        print(f"Error during ingestion: {e}")
        raise

    # Step 4: Verification report
    cursor.execute("SELECT COUNT(*) FROM tags WHERE type = 'company';")
    company_tag_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM tags WHERE type = 'topic';")
    topic_tag_count = cursor.fetchone()[0]

    print("\n--- Summary Verification ---")
    print(f"Total Topic Tags:   {topic_tag_count}")
    print(f"Total Company Tags: {company_tag_count}")

    print("\nTop 15 Companies in Database:")
    cursor.execute("""
        SELECT t.name, COUNT(pt.problem_id) as count
        FROM tags t
        JOIN problem_tags pt ON t.id = pt.tag_id
        WHERE t.type = 'company'
        GROUP BY t.id
        ORDER BY count DESC
        LIMIT 15;
    """)
    for r in cursor.fetchall():
        print(f"  {r[0]}: {r[1]} questions")

    conn.close()

if __name__ == '__main__':
    main()
