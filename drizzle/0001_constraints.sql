CREATE TRIGGER IF NOT EXISTS posts_status_insert_check
BEFORE INSERT ON posts
FOR EACH ROW
WHEN NEW.status NOT IN ('published', 'hidden')
BEGIN
  SELECT RAISE(ABORT, 'invalid post status');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS posts_status_update_check
BEFORE UPDATE OF status ON posts
FOR EACH ROW
WHEN NEW.status NOT IN ('published', 'hidden')
BEGIN
  SELECT RAISE(ABORT, 'invalid post status');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS ad_slots_position_insert_check
BEFORE INSERT ON ad_slots
FOR EACH ROW
WHEN NEW.position NOT IN ('header_bottom', 'sidebar_top', 'content_top', 'content_bottom', 'footer_top')
BEGIN
  SELECT RAISE(ABORT, 'invalid ad position');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS ad_slots_position_update_check
BEFORE UPDATE OF position ON ad_slots
FOR EACH ROW
WHEN NEW.position NOT IN ('header_bottom', 'sidebar_top', 'content_top', 'content_bottom', 'footer_top')
BEGIN
  SELECT RAISE(ABORT, 'invalid ad position');
END;
