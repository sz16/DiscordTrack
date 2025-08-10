import { useQuery } from "@tanstack/react-query";

interface Activity {
  id: string;
  memberId: string;
  type: string;
  channelName: string;
  timestamp: string;
  memberUsername: string;
  memberDisplayName: string;
}

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities/recent"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message':
        return { icon: 'fa-comment', color: 'green' };
      case 'voice_join':
        return { icon: 'fa-microphone', color: 'blue' };
      case 'voice_leave':
        return { icon: 'fa-microphone-slash', color: 'gray' };
      default:
        return { icon: 'fa-user', color: 'purple' };
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'message':
        return `Sent message in #${activity.channelName}`;
      case 'voice_join':
        return `Joined voice channel "${activity.channelName}"`;
      case 'voice_leave':
        return `Left voice channel "${activity.channelName}"`;
      default:
        return 'Unknown activity';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="w-24 h-4 bg-gray-200 rounded mb-1"></div>
                <div className="w-32 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live</span>
        </div>
      </div>
      
      <div className="space-y-4 max-h-80 overflow-y-auto" data-testid="recent-activity-list">
        {activities?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-clock text-2xl mb-2"></i>
            <p>No recent activity</p>
          </div>
        ) : (
          activities?.map((activity) => {
            const { icon, color } = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50" data-testid={`activity-${activity.id}`}>
                <div className={`w-8 h-8 bg-${color}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <i className={`fas ${icon} text-${color}-600 text-xs`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900" data-testid={`activity-user-${activity.id}`}>
                    @{activity.memberUsername}
                  </p>
                  <p className="text-xs text-gray-600" data-testid={`activity-action-${activity.id}`}>
                    {getActivityText(activity)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1" data-testid={`activity-timestamp-${activity.id}`}>
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
