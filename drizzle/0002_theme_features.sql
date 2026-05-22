ALTER TABLE `posts` ADD COLUMN `description` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `posts` ADD COLUMN `tags` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `posts` ADD COLUMN `category` text DEFAULT '随笔' NOT NULL;
--> statement-breakpoint
ALTER TABLE `posts` ADD COLUMN `featured` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `posts` ADD COLUMN `view_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `comments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `post_id` integer NOT NULL,
  `author` text NOT NULL,
  `email` text DEFAULT '' NOT NULL,
  `content` text NOT NULL,
  `status` text DEFAULT 'published' NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `site_visits` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `date` text NOT NULL,
  `path` text DEFAULT '/' NOT NULL,
  `count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `site_visits_date_path_unique` ON `site_visits` (`date`, `path`);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS comments_status_insert_check
BEFORE INSERT ON comments
FOR EACH ROW
WHEN NEW.status NOT IN ('published', 'hidden')
BEGIN
  SELECT RAISE(ABORT, 'invalid comment status');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS comments_status_update_check
BEFORE UPDATE OF status ON comments
FOR EACH ROW
WHEN NEW.status NOT IN ('published', 'hidden')
BEGIN
  SELECT RAISE(ABORT, 'invalid comment status');
END;
