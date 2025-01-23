import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const skullboard = sqliteTable("starboard", {
  messageId: text("message_id").notNull().primaryKey(),
  channelId: text("channel_id").notNull(),
  userId: text("user_id").notNull(),
  skullsCount: int("skulls_count").notNull(),
  skullboardMessageId: text("skullboard_message_id"),
});

export const skullboardConfig = sqliteTable("starboard_config", {
  guildId: text("guild_id").primaryKey(),
  skullboardChannelId: text("skullboard_channel_id").notNull(),
  minSkulls: int("min_stars").default(5).notNull(),
});
