-- Pace Notes admin/D1 preparation schema.
-- Apply remotely only after creating a real Cloudflare D1 database and binding.

CREATE TABLE IF NOT EXISTS posts_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  source_path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  draft INTEGER NOT NULL DEFAULT 1,
  pub_datetime TEXT NOT NULL,
  mod_datetime TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL DEFAULT '',
  checksum TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_index_status_pub ON posts_index(status, pub_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_posts_index_draft ON posts_index(draft);

CREATE TABLE IF NOT EXISTS ad_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_key TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'google-adsense',
  client_id TEXT NOT NULL DEFAULT '',
  slot_id TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 0,
  placement TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_settings (key, value_json) VALUES
  ('siteTitle', '"Pace Notes"'),
  ('adminPathNote', '"PUBLIC_ADMIN_BASE_PATH is evaluated at build time; redeploy after changing it."'),
  ('adsEnabled', 'false');

CREATE TABLE IF NOT EXISTS automation_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_type TEXT NOT NULL,
  status TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT '',
  trigger_source TEXT NOT NULL DEFAULT '',
  requested_by TEXT NOT NULL DEFAULT '',
  started_at TEXT,
  finished_at TEXT,
  duration_ms INTEGER,
  draft_path TEXT,
  post_slug TEXT,
  published_url TEXT,
  commit_sha TEXT,
  validation_summary TEXT,
  source_count INTEGER,
  error TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_type_created ON automation_runs(run_type, created_at DESC);

CREATE TABLE IF NOT EXISTS post_date_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  old_pub_datetime TEXT,
  new_pub_datetime TEXT,
  old_mod_datetime TEXT,
  new_mod_datetime TEXT,
  reason TEXT,
  actor TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO ad_slots (slot_key, placement, notes) VALUES
  ('pageTop', '页首', '页面顶部广告开关'),
  ('pageMiddle', '页中', '正文或列表中部广告开关'),
  ('pageBottom', '页尾', '页面底部广告开关'),
  ('leftRail', '左侧', '桌面端左侧悬浮/侧栏广告开关'),
  ('rightRail', '右侧', '桌面端右侧悬浮/侧栏广告开关');
