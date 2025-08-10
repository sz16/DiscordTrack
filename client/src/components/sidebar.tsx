import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  botStatus?: {
    isReady: boolean;
    isConnected: boolean;
    memberCount: number;
    isActive: boolean;
  };
  onOpenSettings: () => void;
}

export function Sidebar({ botStatus, onOpenSettings }: SidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleBotMutation = useMutation({
    mutationFn: async () => {
      const endpoint = botStatus?.isActive ? "/api/bot/stop" : "/api/bot/start";
      return apiRequest("POST", endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
      toast({
        title: botStatus?.isActive ? "Bot Stopped" : "Bot Started",
        description: botStatus?.isActive ? "Discord monitoring has been stopped" : "Discord monitoring is now active",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const forceCheckMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/reminders/force-check"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Force Check Complete",
        description: "Member activity has been refreshed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = () => {
    if (!botStatus?.isActive) return "bg-gray-50 border-gray-200";
    if (botStatus.isConnected && botStatus.isReady) return "bg-green-50 border-green-200";
    return "bg-yellow-50 border-yellow-200";
  };

  const getStatusText = () => {
    if (!botStatus?.isActive) return "Offline";
    if (botStatus.isConnected && botStatus.isReady) return "Online";
    return "Connecting...";
  };

  const getStatusTextColor = () => {
    if (!botStatus?.isActive) return "text-gray-800";
    if (botStatus.isConnected && botStatus.isReady) return "text-green-800";
    return "text-yellow-800";
  };

  const getStatusIcon = () => {
    if (!botStatus?.isActive) return "text-gray-600";
    if (botStatus.isConnected && botStatus.isReady) return "text-green-600";
    return "text-yellow-600";
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo and Title */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-discord-500 rounded-lg flex items-center justify-center">
            <i className="fab fa-discord text-white text-lg"></i>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Activity Monitor</h1>
            <p className="text-sm text-gray-500">Discord Bot Dashboard</p>
          </div>
        </div>
      </div>

      {/* Bot Status Card */}
      <div className="p-4 border-b border-gray-200">
        <div className={`border rounded-lg p-3 ${getStatusColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${botStatus?.isActive && botStatus.isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className={`text-sm font-medium ${getStatusTextColor()}`}>
                {getStatusText()}
              </span>
            </div>
            <i className={`fas fa-robot ${getStatusIcon()}`}></i>
          </div>
          <p className="text-xs text-gray-700 mt-1">
            Monitoring {botStatus?.memberCount || 0} members
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/"
              data-testid="nav-dashboard"
            >
              {({ active }) => (
                <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  active 
                    ? 'bg-discord-50 text-discord-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                  <i className="fas fa-chart-pie w-5"></i>
                  <span>Dashboard</span>
                </div>
              )}
            </Link>
          </li>
          <li>
            <Link 
              href="/user-activity"
              data-testid="nav-users"
            >
              {({ active }) => (
                <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  active 
                    ? 'bg-discord-50 text-discord-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                  <i className="fas fa-users w-5"></i>
                  <span>User Activity</span>
                </div>
              )}
            </Link>
          </li>
          <li>
            <Link 
              href="/activity-logs"
              data-testid="nav-logs"
            >
              {({ active }) => (
                <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  active 
                    ? 'bg-discord-50 text-discord-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                  <i className="fas fa-list-alt w-5"></i>
                  <span>Activity Logs</span>
                </div>
              )}
            </Link>
          </li>
          <li>
            <Link 
              href="/reminders"
              data-testid="nav-reminders"
            >
              {({ active }) => (
                <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  active 
                    ? 'bg-discord-50 text-discord-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                  <i className="fas fa-bell w-5"></i>
                  <span>Reminders</span>
                </div>
              )}
            </Link>
          </li>
          <li>
            <button 
              onClick={onOpenSettings}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-left"
              data-testid="nav-settings"
            >
              <i className="fas fa-cog w-5"></i>
              <span>Settings</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <Button
            onClick={() => forceCheckMutation.mutate()}
            disabled={forceCheckMutation.isPending}
            variant="outline"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            data-testid="button-force-check"
          >
            <i className="fas fa-refresh"></i>
            <span>Force Check</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
