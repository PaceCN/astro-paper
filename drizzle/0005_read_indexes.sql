CREATE INDEX IF NOT EXISTS posts_status_created_at_idx
ON posts (status, created_at DESC);

CREATE INDEX IF NOT EXISTS posts_status_category_created_at_idx
ON posts (status, category, created_at DESC);

CREATE INDEX IF NOT EXISTS comments_post_status_created_at_idx
ON comments (post_id, status, created_at ASC);

CREATE INDEX IF NOT EXISTS comments_status_created_at_idx
ON comments (status, created_at DESC);
