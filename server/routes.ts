import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { discordBot } from "./services/discord-bot";
import { ReminderService } from "./services/reminder-service";
import { ActivityTracker } from "./services/activity-tracker";
import { insertBotSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const reminderService = new ReminderService(storage);
  const activityTracker = new ActivityTracker(storage);

  // Bot status endpoints
  app.get("/api/bot/status", async (req, res) => {
    try {
      const status = discordBot.getStatus();
      const settings = await storage.getBotSettings();
      
      res.json({
        ...status,
        isActive: settings?.isActive || false,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get bot status" });
    }
  });

  app.post("/api/bot/start", async (req, res) => {
    try {
      await discordBot.connect();
      res.json({ message: "Bot started successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start bot", error: (error as Error).message });
    }
  });

  app.post("/api/bot/stop", async (req, res) => {
    try {
      await discordBot.disconnect();
      res.json({ message: "Bot stopped successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop bot" });
    }
  });

  // Members endpoints
  app.get("/api/members", async (req, res) => {
    try {
      const members = await storage.getAllDiscordMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to get members" });
    }
  });

  app.get("/api/members/stats", async (req, res) => {
    try {
      const members = await storage.getAllDiscordMembers();
      const totalMembers = members.length;
      const activeMembers = members.filter(m => m.status === 'active').length;
      const inactiveMembers = members.filter(m => m.status === 'very_inactive').length;
      
      const reminders = await storage.getRecentReminders('', 1); // Get today's reminders
      const remindersSentToday = reminders.length;

      res.json({
        totalMembers,
        activeMembers,
        inactiveMembers,
        remindersSentToday,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get member stats" });
    }
  });

  app.get("/api/members/inactive", async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      const threshold = settings?.inactivityThreshold || 14;
      const inactiveMembers = await storage.getInactiveMembers(threshold);
      
      // Add reminder info
      const membersWithReminders = await Promise.all(
        inactiveMembers.map(async (member) => {
          const recentReminders = await storage.getRecentReminders(member.id, 30);
          const lastReminder = recentReminders[0];
          
          return {
            ...member,
            lastReminder: lastReminder?.sentAt || null,
            daysSinceLastActivity: Math.floor(
              (Date.now() - (member.lastActivity || member.joinedAt).getTime()) / (1000 * 60 * 60 * 24)
            ),
          };
        })
      );

      res.json(membersWithReminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get inactive members" });
    }
  });

  // Activities endpoints
  app.get("/api/activities/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivities(limit);
      
      // Enrich with member info
      const enrichedActivities = await Promise.all(
        activities.map(async (activity) => {
          const member = await storage.getDiscordMember(activity.memberId);
          return {
            ...activity,
            memberUsername: member?.username || 'Unknown',
            memberDisplayName: member?.displayName || 'Unknown',
          };
        })
      );

      res.json(enrichedActivities);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent activities" });
    }
  });

  // Reminders endpoints
  app.get("/api/reminders/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const remindersList = await storage.getRecentReminders('', 7); // Get last 7 days
      
      // Get the most recent reminders sorted by date
      const sortedReminders = remindersList
        .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
        .slice(0, limit);
      
      res.json(sortedReminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent reminders" });
    }
  });

  app.post("/api/reminders/send/:memberId", async (req, res) => {
    try {
      const { memberId } = req.params;
      const success = await reminderService.sendManualReminder(memberId);
      
      if (success) {
        res.json({ message: "Reminder sent successfully" });
      } else {
        res.status(400).json({ message: "Failed to send reminder" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to send reminder" });
    }
  });

  app.post("/api/reminders/force-check", async (req, res) => {
    try {
      await activityTracker.classifyAllMembers();
      res.json({ message: "Force check completed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to perform force check" });
    }
  });

  // Settings endpoints
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const validatedData = insertBotSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateBotSettings(validatedData);
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
