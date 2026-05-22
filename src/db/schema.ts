import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const adPositions = ['header_bottom', 'content_top', 'content_bottom', 'footer_top'] as const;
export type AdPosition = (typeof adPositions)[number];

export const commentStatuses = ['published', 'hidden'] as const;
export type CommentStatus = (typeof commentStatuses)[number];

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull()
  },
  (table) => [uniqueIndex('users_username_unique').on(table.username)]
);

export const posts = sqliteTable(
  'posts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    content: text('content').notNull(),
    description: text('description').notNull().default(''),
    tags: text('tags').notNull().default(''),
    category: text('category').notNull().default('随笔'),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    viewCount: integer('view_count').notNull().default(0),
    status: text('status', { enum: ['published', 'hidden'] }).notNull().default('hidden'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
  },
  (table) => [uniqueIndex('posts_slug_unique').on(table.slug)]
);

export const adSlots = sqliteTable(
  'ad_slots',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    position: text('position', { enum: adPositions }).notNull(),
    adCode: text('ad_code').notNull().default(''),
    isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(false)
  },
  (table) => [uniqueIndex('ad_slots_position_unique').on(table.position)]
);

export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  author: text('author').notNull(),
  email: text('email').notNull().default(''),
  content: text('content').notNull(),
  status: text('status', { enum: commentStatuses }).notNull().default('published'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

export const siteVisits = sqliteTable(
  'site_visits',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    path: text('path').notNull().default('/'),
    count: integer('count').notNull().default(0)
  },
  (table) => [uniqueIndex('site_visits_date_path_unique').on(table.date, table.path)]
);
