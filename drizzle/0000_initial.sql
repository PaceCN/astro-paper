CREATE TABLE IF NOT EXISTS `users` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `username` text NOT NULL,
  `password_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_username_unique` ON `users` (`username`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `posts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `title` text NOT NULL,
  `slug` text NOT NULL,
  `content` text NOT NULL,
  `status` text DEFAULT 'hidden' NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `posts_slug_unique` ON `posts` (`slug`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ad_slots` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `position` text NOT NULL,
  `ad_code` text DEFAULT '' NOT NULL,
  `is_enabled` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `ad_slots_position_unique` ON `ad_slots` (`position`);
--> statement-breakpoint
INSERT OR IGNORE INTO `ad_slots` (`position`, `ad_code`, `is_enabled`) VALUES
  ('header_bottom', '', 0),
  ('content_top', '', 0),
  ('content_bottom', '', 0),
  ('footer_top', '', 0);
