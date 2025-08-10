import { Client } from 'discord.js';
import { IStorage } from '../storage';
import { discordBot } from './discord-bot';

export class ReminderService {
  private intervalId: NodeJS.Timeout | null = null;
  private client: Client | null = null;

  constructor(private storage: IStorage) {}

  start(client: Client) {
    this.client = client;
    
    // Check for inactive users every 10 minutes
    this.intervalId = setInterval(async () => {
      await this.checkAndSendReminders();
    }, 10 * 60 * 1000);

    console.log('Reminder service started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Reminder service stopped');
  }

  private async checkAndSendReminders() {
    try {
      const settings = await this.storage.getBotSettings();
      if (!settings?.isActive) return;

      // Check rate limiting
      const lastReminder = await this.storage.getLastGlobalReminder();
      if (lastReminder) {
        const timeSinceLastReminder = Date.now() - lastReminder.sentAt.getTime();
        const rateLimitMs = (settings.rateLimitMinutes || 10) * 60 * 1000;
        
        if (timeSinceLastReminder < rateLimitMs) {
          return; // Still in rate limit period
        }
      }

      // Get inactive members
      const inactiveMembers = await this.storage.getInactiveMembers(settings.inactivityThreshold || 14);
      
      for (const member of inactiveMembers) {
        // Check if we've sent a reminder recently to this user
        const recentReminders = await this.storage.getRecentReminders(
          member.id, 
          settings.reminderCooldown || 3
        );
        
        if (recentReminders.length > 0) {
          continue; // Skip this user, already reminded recently
        }

        // Calculate days since last activity
        const lastActivity = member.lastActivity || member.joinedAt;
        const daysSinceLastActivity = Math.floor(
          (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send reminder
        const message = (settings.reminderTemplate || "Hey {user}! You've been inactive for {days} days.")
          .replace('{user}', `<@${member.id}>`)
          .replace('{days}', daysSinceLastActivity.toString());

        const success = await discordBot.sendReminderMessage(member.id, message);
        
        if (success) {
          await this.storage.createReminder({
            memberId: member.id,
            daysSinceLastActivity,
            channelName: 'bot-channel', // This will be updated by the actual channel used
          });

          console.log(`Sent reminder to ${member.username} (${daysSinceLastActivity} days inactive)`);
          
          // Only send one reminder per check to avoid spam
          break;
        }
      }
    } catch (error) {
      console.error('Error in reminder service:', error);
    }
  }

  async sendManualReminder(memberId: string): Promise<boolean> {
    try {
      const member = await this.storage.getDiscordMember(memberId);
      if (!member) return false;

      const settings = await this.storage.getBotSettings();
      if (!settings) return false;

      const lastActivity = member.lastActivity || member.joinedAt;
      const daysSinceLastActivity = Math.floor(
        (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      const message = (settings.reminderTemplate || "Hey {user}! You've been inactive for {days} days.")
        .replace('{user}', `<@${member.id}>`)
        .replace('{days}', daysSinceLastActivity.toString());

      const success = await discordBot.sendReminderMessage(member.id, message);
      
      if (success) {
        await this.storage.createReminder({
          memberId: member.id,
          daysSinceLastActivity,
          channelName: 'manual-reminder',
        });
      }

      return success;
    } catch (error) {
      console.error('Error sending manual reminder:', error);
      return false;
    }
  }
}
