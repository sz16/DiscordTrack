import { IStorage } from '../storage';

export class ActivityTracker {
  constructor(private storage: IStorage) {}

  async trackMessage(memberId: string, username: string, channelName: string) {
    try {
      // Record the activity
      await this.storage.createActivity({
        memberId,
        type: 'message',
        channelName,
        data: null,
      });

      // Update member info
      await this.updateMemberActivity(memberId, username);
      
      console.log(`Tracked message from ${username} in #${channelName}`);
    } catch (error) {
      console.error('Error tracking message:', error);
    }
  }

  async trackVoiceJoin(memberId: string, username: string, channelName: string) {
    try {
      await this.storage.createActivity({
        memberId,
        type: 'voice_join',
        channelName,
        data: JSON.stringify({ joinedAt: new Date().toISOString() }),
      });

      await this.updateMemberActivity(memberId, username);
      
      console.log(`Tracked voice join from ${username} in ${channelName}`);
    } catch (error) {
      console.error('Error tracking voice join:', error);
    }
  }

  async trackVoiceLeave(memberId: string, username: string, channelName: string) {
    try {
      await this.storage.createActivity({
        memberId,
        type: 'voice_leave',
        channelName,
        data: JSON.stringify({ leftAt: new Date().toISOString() }),
      });

      console.log(`Tracked voice leave from ${username} in ${channelName}`);
    } catch (error) {
      console.error('Error tracking voice leave:', error);
    }
  }

  private async updateMemberActivity(memberId: string, username: string) {
    try {
      let member = await this.storage.getDiscordMember(memberId);
      
      if (!member) {
        // Create member if doesn't exist
        member = await this.storage.createDiscordMember({
          id: memberId,
          username,
          displayName: username,
          joinedAt: new Date(),
          lastActivity: null,
        });
      }

      // Update last activity and calculate stats
      const now = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get activities from the last week
      const recentActivities = await this.storage.getActivitiesByMember(memberId);
      const weekActivities = recentActivities.filter(activity => activity.timestamp >= weekAgo);
      
      const messagesThisWeek = weekActivities.filter(activity => activity.type === 'message').length;
      const voiceJoins = weekActivities.filter(activity => activity.type === 'voice_join');
      
      // Calculate voice time (simplified - assuming average session length)
      const voiceTimeThisWeek = voiceJoins.length * 30; // 30 minutes average per session

      // Determine status
      let status = 'inactive';
      const daysSinceLastActivity = member.lastActivity 
        ? Math.floor((now.getTime() - member.lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((now.getTime() - member.joinedAt.getTime()) / (1000 * 60 * 60 * 24));

      if (messagesThisWeek > 0 || voiceJoins.length > 0) {
        status = 'active';
      } else if (daysSinceLastActivity >= 14) {
        status = 'very_inactive';
      }

      await this.storage.updateDiscordMember(memberId, {
        lastActivity: now,
        status,
        messagesThisWeek,
        voiceTimeThisWeek,
        totalMessages: (member.totalMessages || 0) + (messagesThisWeek > (member.messagesThisWeek || 0) ? 1 : 0),
        totalVoiceTime: (member.totalVoiceTime || 0) + Math.max(0, voiceTimeThisWeek - (member.voiceTimeThisWeek || 0)),
      });

    } catch (error) {
      console.error('Error updating member activity:', error);
    }
  }

  async classifyAllMembers() {
    try {
      const members = await this.storage.getAllDiscordMembers();
      const now = new Date();
      
      for (const member of members) {
        const lastActivity = member.lastActivity || member.joinedAt;
        const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        let status = 'inactive';
        if ((member.messagesThisWeek || 0) > 0 || (member.voiceTimeThisWeek || 0) > 0) {
          status = 'active';
        } else if (daysSinceLastActivity >= 14) {
          status = 'very_inactive';
        }

        if (member.status !== status) {
          await this.storage.updateDiscordMember(member.id, { status });
        }
      }
    } catch (error) {
      console.error('Error classifying members:', error);
    }
  }
}
