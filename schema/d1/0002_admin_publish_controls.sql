-- Pace Notes admin publish controls migration.
-- Safe subset: this creates the publish queue and fixed ad slots.
-- If ALTER TABLE duplicate-column errors happen in D1 console, skip those ALTER lines.

INSERT OR IGNORE INTO ad_slots (slot_key, placement, notes) VALUES
  ('pageTop', '页首', '页面顶部广告开关'),
  ('pageMiddle', '页中', '正文或列表中部广告开关'),
  ('pageBottom', '页尾', '页面底部广告开关'),
  ('leftRail', '左侧', '桌面端左侧悬浮/侧栏广告开关'),
  ('rightRail', '右侧', '桌面端右侧悬浮/侧栏广告开关');

CREATE TABLE IF NOT EXISTS publish_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT '',
  prompt TEXT NOT NULL DEFAULT '',
  target_slug TEXT,
  run_type TEXT NOT NULL DEFAULT '',
  requested_by TEXT NOT NULL DEFAULT 'admin',
  claimed_by TEXT,
  claimed_at TEXT,
  completed_at TEXT,
  automation_run_id INTEGER,
  result_summary TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_publish_requests_status_created
ON publish_requests(status, created_at ASC);
