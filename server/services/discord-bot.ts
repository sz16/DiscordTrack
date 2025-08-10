import { Client, GatewayIntentBits, ChannelType, TextChannel } from 'discord.js';
import { storage } from '../storage';
import { ActivityTracker } from './activity-tracker';
import { ReminderService } from './reminder-service';

export class DiscordBot {
  private client: Client;
  private activityTracker: ActivityTracker;
  private reminderService: ReminderService;
  private isReady = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });

    this.activityTracker = new ActivityTracker(storage);
    this.reminderService = new ReminderService(storage);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.client.on('ready', async () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
      this.isReady = true;
      
      // Initialize members from the server
      await this.initializeMembers();
      
      // Start reminder service
      this.reminderService.start(this.client);
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      
      const channelName = 'name' in message.channel ? message.channel.name : 'DM';
      await this.activityTracker.trackMessage(message.author.id, message.author.username, channelName);
    });

    this.client.on('voiceStateUpdate', async (oldState, newState) => {
      const member = newState.member;
      if (!member || member.user.bot) return;

      if (!oldState.channelId && newState.channelId) {
        // User joined voice channel
        await this.activityTracker.trackVoiceJoin(
          member.id, 
          member.user.username, 
          newState.channel?.name || 'Unknown'
        );
      } else if (oldState.channelId && !newState.channelId) {
        // User left voice channel
        await this.activityTracker.trackVoiceLeave(
          member.id, 
          member.user.username, 
          oldState.channel?.name || 'Unknown'
        );
      }
    });

    this.client.on('guildMemberAdd', async (member) => {
      if (member.user.bot) return;
      
      await storage.createDiscordMember({
        id: member.id,
        username: member.user.username,
        displayName: member.displayName,
        joinedAt: member.joinedAt || new Date(),
        lastActivity: null,
      });
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
    });
  }

  private async initializeMembers() {
    try {
      const settings = await storage.getBotSettings();
      
      // If no serverId is set, use the first guild the bot is in
      let guildId = settings?.serverId;
      if (!guildId && this.client.guilds.cache.size > 0) {
        guildId = this.client.guilds.cache.first()?.id;
        if (guildId) {
          // Update settings with the server ID
          await storage.updateBotSettings({ serverId: guildId });
          console.log(`Auto-configured server ID: ${guildId}`);
        }
      }
      
      if (!guildId) {
        console.log('No server ID configured and no guilds available');
        return;
      }

      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) {
        console.log(`Guild ${guildId} not found`);
        return;
      }

      console.log(`Initializing members for guild: ${guild.name} (${guild.id})`);
      await guild.members.fetch();
      console.log(`Fetched ${guild.members.cache.size} members from Discord`);
      
      let processedCount = 0;
      for (const [memberId, member] of guild.members.cache) {
        if (member.user.bot) continue;

        const existingMember = await storage.getDiscordMember(memberId);
        if (!existingMember) {
          await storage.createDiscordMember({
            id: memberId,
            username: member.user.username,
            displayName: member.displayName,
            joinedAt: member.joinedAt || new Date(),
            lastActivity: null,
          });
          processedCount++;
        }
      }
      console.log(`Processed ${processedCount} new members into storage`);
    } catch (error) {
      console.error('Error initializing members:', error);
    }
  }

  async connect() {
    try {
      const settings = await storage.getBotSettings();
      
      if (!settings?.discordToken) {
        throw new Error('Discord token not configured');
      }

      await this.client.login(settings.discordToken);
      await storage.updateBotSettings({ isActive: true });
    } catch (error) {
      console.error('Failed to connect Discord bot:', error);
      await storage.updateBotSettings({ isActive: false });
      throw error;
    }
  }

  async disconnect() {
    this.reminderService.stop();
    await this.client.destroy();
    await storage.updateBotSettings({ isActive: false });
    this.isReady = false;
  }

  getStatus() {
    return {
      isReady: this.isReady,
      isConnected: this.client.isReady(),
      memberCount: this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
    };
  }

  async sendReminderMessage(memberId: string, message: string): Promise<boolean> {
    try {
      const settings = await storage.getBotSettings();
      if (!settings?.serverId) return false;

      const guild = this.client.guilds.cache.get(settings.serverId);
      if (!guild) return false;

      // Find channels with "bot" in the name
      const botChannels = guild.channels.cache.filter(
        channel => channel.type === ChannelType.GuildText && 
        channel.name.toLowerCase().includes('bot')
      );

      if (botChannels.size === 0) return false;

      // Send to the first bot channel found
      const channel = botChannels.first() as TextChannel;
      await channel.send(message);
      
      return true;
    } catch (error) {
      console.error('Error sending reminder message:', error);
      return false;
    }
  }
}

// Global instance
export const discordBot = new DiscordBot();
