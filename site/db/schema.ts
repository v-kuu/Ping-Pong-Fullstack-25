import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  password: text('password').notNull(),
  email: text('email').unique().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  elo: integer('elo').default(1000).notNull(),
});

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  game: text('game', { enum: ['pong', 'web3d'] }).notNull(),
  player1Id: integer('player1_id').notNull().references(() => users.id),
  player2Id: integer('player2_id').notNull().references(() => users.id),
  winnerId: integer('winner_id').references(() => users.id),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  score: text('score'), // Format: "3-2"
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;