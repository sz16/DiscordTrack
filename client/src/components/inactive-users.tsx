import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface InactiveMember {
  id: string;
  username: string;
  displayName: string | null;
  status: string;
  lastReminder: string | null;
  daysSinceLastActivity: number;
}

export function InactiveUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inactiveMembers, isLoading } = useQuery<InactiveMember[]>({
    queryKey: ["/api/members/inactive"],
    refetchInterval: 30000,
  });

  const sendReminderMutation = useMutation({
    mutationFn: (memberId: string) => apiRequest("POST", `/api/reminders/send/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/inactive"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/stats"] });
      toast({
        title: "Reminder Sent",
        description: "Reminder message has been sent successfully",
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

  const getInitials = (username: string, displayName?: string | null) => {
    const name = displayName || username;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatLastReminder = (lastReminder: string | null) => {
    if (!lastReminder) return "No reminder sent";
    
    const date = new Date(lastReminder);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Reminded today";
    if (diffInDays === 1) return "Reminded yesterday";
    return `Reminded ${diffInDays} days ago`;
  };

  const getStatusColor = (daysSinceLastActivity: number) => {
    if (daysSinceLastActivity >= 21) return "bg-red-50 border-red-200";
    if (daysSinceLastActivity >= 14) return "bg-orange-50 border-orange-200";
    return "bg-yellow-50 border-yellow-200";
  };

  const getStatusTextColor = (daysSinceLastActivity: number) => {
    if (daysSinceLastActivity >= 21) return "text-red-600";
    if (daysSinceLastActivity >= 14) return "text-orange-600";
    return "text-yellow-600";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Inactive Users (2+ weeks)</h3>
          <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div>
                  <div className="w-24 h-4 bg-gray-300 rounded mb-1"></div>
                  <div className="w-32 h-3 bg-gray-300 rounded"></div>
                </div>
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
        <h3 className="text-lg font-semibold text-gray-900">Inactive Users (2+ weeks)</h3>
        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full" data-testid="inactive-count">
          {inactiveMembers?.length || 0} users
        </span>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto" data-testid="inactive-users-list">
        {inactiveMembers?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-smile text-2xl mb-2"></i>
            <p>No inactive users!</p>
            <p className="text-sm">All members are active</p>
          </div>
        ) : (
          inactiveMembers?.map((member) => (
            <div 
              key={member.id} 
              className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(member.daysSinceLastActivity)}`}
              data-testid={`inactive-user-${member.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600" data-testid={`user-initials-${member.id}`}>
                    {getInitials(member.username, member.displayName)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900" data-testid={`user-name-${member.id}`}>
                    @{member.username}
                  </p>
                  <p className={`text-xs ${getStatusTextColor(member.daysSinceLastActivity)}`} data-testid={`user-inactive-days-${member.id}`}>
                    Inactive for {member.daysSinceLastActivity} days
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500" data-testid={`user-last-reminder-${member.id}`}>
                  {formatLastReminder(member.lastReminder)}
                </span>
                <Button
                  onClick={() => sendReminderMutation.mutate(member.id)}
                  disabled={sendReminderMutation.isPending}
                  variant="ghost"
                  size="sm"
                  className={`${getStatusTextColor(member.daysSinceLastActivity)} hover:bg-opacity-20 text-xs font-medium`}
                  data-testid={`button-send-reminder-${member.id}`}
                >
                  <i className="fas fa-bell"></i>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {inactiveMembers && inactiveMembers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            data-testid="button-send-all-reminders"
          >
            Send Reminders to All Eligible Users
          </Button>
        </div>
      )}
    </div>
  );
}
