import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Activity {
  id: string;
  memberId: string;
  type: string;
  channelName: string;
  timestamp: string;
  memberUsername: string;
  memberDisplayName: string;
  data?: string;
}

export default function ActivityLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [limit, setLimit] = useState(50);

  const { data: activities, isLoading, refetch } = useQuery<Activity[]>({
    queryKey: ["/api/activities/recent", { limit }],
    refetchInterval: 5000,
  });

  const filteredActivities = activities?.filter(activity => {
    const matchesSearch = activity.memberUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.channelName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || activity.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message':
        return { icon: 'fa-comment', color: 'text-green-600', bg: 'bg-green-100' };
      case 'voice_join':
        return { icon: 'fa-microphone', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'voice_leave':
        return { icon: 'fa-microphone-slash', color: 'text-gray-600', bg: 'bg-gray-100' };
      default:
        return { icon: 'fa-user', color: 'text-purple-600', bg: 'bg-purple-100' };
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
    return date.toLocaleString();
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600 mt-2">Real-time feed of all server member activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by username or channel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                data-testid="input-search-activities"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48" data-testid="select-type-filter">
                <SelectValue placeholder="All Activities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="message">Messages</SelectItem>
                <SelectItem value="voice_join">Voice Join</SelectItem>
                <SelectItem value="voice_leave">Voice Leave</SelectItem>
              </SelectContent>
            </Select>
            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger className="w-32" data-testid="select-limit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 logs</SelectItem>
                <SelectItem value="50">50 logs</SelectItem>
                <SelectItem value="100">100 logs</SelectItem>
                <SelectItem value="200">200 logs</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh">
              <i className="fas fa-refresh mr-2"></i>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed ({filteredActivities.length} activities)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto" data-testid="activity-logs-list">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-clock text-4xl text-gray-400 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const { icon, color, bg } = getActivityIcon(activity.type);
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    data-testid={`activity-log-${activity.id}`}
                  >
                    <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <i className={`fas ${icon} ${color} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900" data-testid={`activity-user-${activity.id}`}>
                          @{activity.memberUsername}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span data-testid={`activity-relative-time-${activity.id}`}>
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span data-testid={`activity-timestamp-${activity.id}`}>
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1" data-testid={`activity-description-${activity.id}`}>
                        {getActivityText(activity)}
                      </p>
                      {activity.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Show details
                          </summary>
                          <pre className="text-xs text-gray-600 mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                            {activity.data}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}