import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const discordMembers = pgTable("discord_members", {
  id: varchar("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name"),
  joinedAt: timestamp("joined_at").notNull(),
  lastActivity: timestamp("last_activity"),
  status: text("status").notNull().default("inactive"), // active, inactive, very_inactive
  messagesThisWeek: integer("messages_this_week").default(0),
  voiceTimeThisWeek: integer("voice_time_this_week").default(0), // in minutes
  totalMessages: integer("total_messages").default(0),
  totalVoiceTime: integer("total_voice_time").default(0), // in minutes
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  type: text("type").notNull(), // message, voice_join, voice_leave
  channelName: text("channel_name"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  data: text("data"), // JSON string for additional data
});

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  daysSinceLastActivity: integer("days_since_last_activity").notNull(),
  channelName: text("channel_name").notNull(),
});

export const botSettings = pgTable("bot_settings", {
  id: varchar("id").primaryKey().default("default"),
  discordToken: text("discord_token"),
  serverId: text("server_id"),
  inactivityThreshold: integer("inactivity_threshold").default(14), // days
  reminderCooldown: integer("reminder_cooldown").default(3), // days
  rateLimitMinutes: integer("rate_limit_minutes").default(10),
  reminderTemplate: text("reminder_template").default("Hey {user}! 👋 We noticed you haven't been active for {days} days. We miss you in the server! Come say hi when you get a chance. 😊"),
  isActive: boolean("is_active").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDiscordMemberSchema = createInsertSchema(discordMembers);

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  sentAt: true,
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDiscordMember = z.infer<typeof insertDiscordMemberSchema>;
export type DiscordMember = typeof discordMembers.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;

export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type BotSettings = typeof botSettings.$inferSelect;
