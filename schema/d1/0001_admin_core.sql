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

CREATE TABLE IF NOT EXISTS automation_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_type TEXT NOT NULL,
  status TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT '',
  started_at TEXT,
  finished_at TEXT,
  duration_ms INTEGER,
  draft_path TEXT,
  commit_sha TEXT,
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
  ('homeAfterHero', '首页介绍后', '低干扰展示位，申请通过前保持关闭'),
  ('homeAfterRecent', '首页最新文章后', '列表之后展示，避免首屏广告过重'),
  ('postTop', '文章标题下', '谨慎启用，避免影响首屏体验'),
  ('postMiddle', '文章正文中段', '后续按文章长度动态启用'),
  ('postBottom', '文章正文后', '优先推荐的低干扰广告位');
