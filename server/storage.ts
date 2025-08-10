import { 
  type User, 
  type InsertUser, 
  type DiscordMember, 
  type InsertDiscordMember,
  type Activity,
  type InsertActivity,
  type Reminder,
  type InsertReminder,
  type BotSettings,
  type InsertBotSettings
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Discord member methods
  getDiscordMember(id: string): Promise<DiscordMember | undefined>;
  getAllDiscordMembers(): Promise<DiscordMember[]>;
  createDiscordMember(member: InsertDiscordMember): Promise<DiscordMember>;
  updateDiscordMember(id: string, updates: Partial<DiscordMember>): Promise<DiscordMember>;
  getInactiveMembers(dayThreshold: number): Promise<DiscordMember[]>;

  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByMember(memberId: string, limit?: number): Promise<Activity[]>;
  getRecentActivities(limit?: number): Promise<Activity[]>;

  // Reminder methods
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  getRecentReminders(memberId: string, days: number): Promise<Reminder[]>;
  getLastGlobalReminder(): Promise<Reminder | undefined>;

  // Bot settings methods
  getBotSettings(): Promise<BotSettings | undefined>;
  updateBotSettings(settings: Partial<BotSettings>): Promise<BotSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private discordMembers: Map<string, DiscordMember>;
  private activities: Activity[];
  private reminders: Reminder[];
  private botSettings: BotSettings | undefined;

  constructor() {
    this.users = new Map();
    this.discordMembers = new Map();
    this.activities = [];
    this.reminders = [];
    this.botSettings = {
      id: "default",
      discordToken: process.env.DISCORD_TOKEN || null,
      serverId: null,
      inactivityThreshold: 14,
      reminderCooldown: 3,
      rateLimitMinutes: 10,
      reminderTemplate: "Hey {user}! 👋 We noticed you haven't been active for {days} days. We miss you in the server! Come say hi when you get a chance. 😊",
      isActive: false,
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDiscordMember(id: string): Promise<DiscordMember | undefined> {
    return this.discordMembers.get(id);
  }

  async getAllDiscordMembers(): Promise<DiscordMember[]> {
    return Array.from(this.discordMembers.values());
  }

  async createDiscordMember(member: InsertDiscordMember): Promise<DiscordMember> {
    const discordMember: DiscordMember = {
      id: member.id,
      username: member.username,
      displayName: member.displayName,
      joinedAt: member.joinedAt,
      lastActivity: member.lastActivity,
      status: "inactive",
      messagesThisWeek: 0,
      voiceTimeThisWeek: 0,
      totalMessages: 0,
      totalVoiceTime: 0,
    };
    this.discordMembers.set(member.id, discordMember);
    return discordMember;
  }

  async updateDiscordMember(id: string, updates: Partial<DiscordMember>): Promise<DiscordMember> {
    const existing = this.discordMembers.get(id);
    if (!existing) {
      throw new Error(`Discord member ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.discordMembers.set(id, updated);
    return updated;
  }

  async getInactiveMembers(dayThreshold: number): Promise<DiscordMember[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dayThreshold);
    
    return Array.from(this.discordMembers.values()).filter(member => {
      const lastActivity = member.lastActivity || member.joinedAt;
      return lastActivity < cutoffDate;
    });
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const newActivity: Activity = {
      id: randomUUID(),
      memberId: activity.memberId,
      type: activity.type,
      channelName: activity.channelName,
      data: activity.data || null,
      timestamp: new Date(),
    };
    this.activities.push(newActivity);
    return newActivity;
  }

  async getActivitiesByMember(memberId: string, limit?: number): Promise<Activity[]> {
    const memberActivities = this.activities
      .filter(activity => activity.memberId === memberId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? memberActivities.slice(0, limit) : memberActivities;
  }

  async getRecentActivities(limit = 10): Promise<Activity[]> {
    return this.activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const newReminder: Reminder = {
      ...reminder,
      id: randomUUID(),
      sentAt: new Date(),
    };
    this.reminders.push(newReminder);
    return newReminder;
  }

  async getRecentReminders(memberId: string, days: number): Promise<Reminder[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    if (memberId === '') {
      // Return all reminders if no specific member ID
      return this.reminders.filter(reminder => reminder.sentAt >= cutoffDate);
    }
    
    return this.reminders.filter(reminder => 
      reminder.memberId === memberId && reminder.sentAt >= cutoffDate
    );
  }

  async getLastGlobalReminder(): Promise<Reminder | undefined> {
    return this.reminders
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())[0];
  }

  async getBotSettings(): Promise<BotSettings | undefined> {
    return this.botSettings;
  }

  async updateBotSettings(settings: Partial<BotSettings>): Promise<BotSettings> {
    this.botSettings = { ...this.botSettings!, ...settings };
    return this.botSettings;
  }
}

export const storage = new MemStorage();
