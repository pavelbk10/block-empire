import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{id:text('id').primaryKey(),payload:text('payload').notNull(),revision:integer('revision').notNull().default(0),updated:integer('updated').notNull()});
