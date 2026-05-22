DROP TRIGGER IF EXISTS comments_status_insert_check;
--> statement-breakpoint
DROP TRIGGER IF EXISTS comments_status_update_check;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS comments_status_insert_check
BEFORE INSERT ON comments
FOR EACH ROW
WHEN NEW.status NOT IN ('pending', 'published', 'hidden')
BEGIN
  SELECT RAISE(ABORT, 'invalid comment status');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS comments_status_update_check
BEFORE UPDATE OF status ON comments
FOR EACH ROW
WHEN NEW.status NOT IN ('pending', 'published', 'hidden')
BEGIN
  SELECT RAISE(ABORT, 'invalid comment status');
END;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `site_settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `site_settings` (`key`, `value`) VALUES
  ('comments_enabled', 'true'),
  ('site_title', ''),
  ('site_desc', ''),
  ('site_author', ''),
  ('site_profile', ''),
  ('site_avatar', ''),
  ('sidebar_profile', 'true'),
  ('sidebar_visits', 'true'),
  ('sidebar_tags', 'true'),
  ('sidebar_categories', 'true'),
  ('sidebar_stack', 'true'),
  ('tags_enabled', 'true'),
  ('tech_stack', 'Astro,Tailwind,Cloudflare,D1,Hono,Drizzle');
