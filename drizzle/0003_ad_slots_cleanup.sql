DROP TRIGGER IF EXISTS ad_slots_position_insert_check;
--> statement-breakpoint
DROP TRIGGER IF EXISTS ad_slots_position_update_check;
--> statement-breakpoint
DELETE FROM `ad_slots` WHERE `position` = 'sidebar_top';
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS ad_slots_position_insert_check
BEFORE INSERT ON ad_slots
FOR EACH ROW
WHEN NEW.position NOT IN ('header_bottom', 'content_top', 'content_bottom', 'footer_top')
BEGIN
  SELECT RAISE(ABORT, 'invalid ad position');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS ad_slots_position_update_check
BEFORE UPDATE OF position ON ad_slots
FOR EACH ROW
WHEN NEW.position NOT IN ('header_bottom', 'content_top', 'content_bottom', 'footer_top')
BEGIN
  SELECT RAISE(ABORT, 'invalid ad position');
END;
