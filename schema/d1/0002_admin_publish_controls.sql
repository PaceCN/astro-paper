-- Pace Notes admin publish controls migration.
-- Safe subset: this creates the publish queue and fixed ad slots.
-- If ALTER TABLE duplicate-column errors happen in D1 console, skip those ALTER lines.

INSERT OR IGNORE INTO ad_slots (slot_key, placement, notes) VALUES
  ('homeAfterHero', '首页介绍后', '首页介绍区下方广告位，可作为首页首个低干扰广告位。'),
  ('homeAfterRecent', '首页最近文章后', '首页最近文章列表后方广告位。'),
  ('postTop', '文章顶部', '文章标题附近广告位，默认建议关闭，避免首屏体验变差。'),
  ('postMiddle', '文章中部', '长文章中段广告位，默认建议关闭，确认体验后再启用。'),
  ('postBottom', '文章底部', '文章结尾后的广告位，优先建议从这里开始启用。'),
  ('leftRail', '桌面左侧栏', '桌面端左侧栏广告位；当前前台组件未默认渲染。'),
  ('rightRail', '桌面右侧栏', '桌面端右侧栏广告位；当前前台组件未默认渲染。');

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
