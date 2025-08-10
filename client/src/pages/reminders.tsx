import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InactiveMember {
  id: string;
  username: string;
  displayName: string | null;
  status: string;
  lastReminder: string | null;
  daysSinceLastActivity: number;
}

interface Reminder {
  id: string;
  memberId: string;
  sentAt: string;
  daysSinceLastActivity: number;
  channelName: string;
}

export default function Reminders() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inactiveMembers, isLoading: loadingMembers } = useQuery<InactiveMember[]>({
    queryKey: ["/api/members/inactive"],
    refetchInterval: 30000,
  });

  const { data: recentReminders, isLoading: loadingReminders } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders/recent"],
    refetchInterval: 10000,
  });

  const sendReminderMutation = useMutation({
    mutationFn: (memberId: string) => apiRequest("POST", `/api/reminders/send/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/inactive"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/stats"] });
      toast({
        title: "Reminder Sent",
        description: "Reminder message has been sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const sendAllRemindersMutation = useMutation({
    mutationFn: async () => {
      const eligibleMembers = filteredInactiveMembers.filter(member => 
        !member.lastReminder || 
        (Date.now() - new Date(member.lastReminder).getTime()) > (3 * 24 * 60 * 60 * 1000)
      );
      
      for (const member of eligibleMembers) {
        await apiRequest("POST", `/api/reminders/send/${member.id}`);
      }
      return eligibleMembers.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/inactive"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/stats"] });
      toast({
        title: "Bulk Reminders Sent",
        description: `Sent reminders to ${count} eligible members`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const filteredInactiveMembers = inactiveMembers?.filter(member =>
    member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

  const getUrgencyBadge = (daysSinceLastActivity: number) => {
    if (daysSinceLastActivity >= 30) return { variant: "destructive" as const, text: "Critical" };
    if (daysSinceLastActivity >= 21) return { variant: "destructive" as const, text: "High" };
    if (daysSinceLastActivity >= 14) return { variant: "secondary" as const, text: "Medium" };
    return { variant: "outline" as const, text: "Low" };
  };

  const canSendReminder = (member: InactiveMember) => {
    if (!member.lastReminder) return true;
    const daysSinceReminder = Math.floor((Date.now() - new Date(member.lastReminder).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceReminder >= 3;
  };

  if (loadingMembers) {
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reminder Management</h1>
        <p className="text-gray-600 mt-2">Manage reminders for inactive members and view reminder history</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{filteredInactiveMembers.length}</div>
            <div className="text-sm text-gray-600">Inactive Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {filteredInactiveMembers.filter(m => canSendReminder(m)).length}
            </div>
            <div className="text-sm text-gray-600">Eligible for Reminder</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {filteredInactiveMembers.filter(m => m.daysSinceLastActivity >= 30).length}
            </div>
            <div className="text-sm text-gray-600">Critical (30+ days)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {recentReminders?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Recent Reminders</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <Input
                type="text"
                placeholder="Search inactive members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-inactive"
              />
            </div>
            <Button
              onClick={() => sendAllRemindersMutation.mutate()}
              disabled={sendAllRemindersMutation.isPending || filteredInactiveMembers.filter(m => canSendReminder(m)).length === 0}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-send-all-reminders"
            >
              <i className="fas fa-bell mr-2"></i>
              Send All Eligible ({filteredInactiveMembers.filter(m => canSendReminder(m)).length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inactive Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Inactive Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-y-auto" data-testid="inactive-members-list">
            {filteredInactiveMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-smile text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No inactive members!</h3>
                <p>All members are active</p>
              </div>
            ) : (
              filteredInactiveMembers.map((member) => {
                const urgency = getUrgencyBadge(member.daysSinceLastActivity);
                const eligible = canSendReminder(member);
                
                return (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    data-testid={`inactive-member-${member.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {getInitials(member.username, member.displayName)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900" data-testid={`member-username-${member.id}`}>
                            @{member.username}
                          </p>
                          <Badge variant={urgency.variant}>{urgency.text}</Badge>
                        </div>
                        <p className="text-sm text-gray-600" data-testid={`member-inactive-days-${member.id}`}>
                          Inactive for {member.daysSinceLastActivity} days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500" data-testid={`member-last-reminder-${member.id}`}>
                          {formatLastReminder(member.lastReminder)}
                        </p>
                        {!eligible && (
                          <p className="text-xs text-orange-600">Cooldown active</p>
                        )}
                      </div>
                      <Button
                        onClick={() => sendReminderMutation.mutate(member.id)}
                        disabled={sendReminderMutation.isPending || !eligible}
                        variant={eligible ? "default" : "secondary"}
                        size="sm"
                        data-testid={`button-send-reminder-${member.id}`}
                      >
                        <i className="fas fa-bell mr-1"></i>
                        {eligible ? "Send Reminder" : "On Cooldown"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reminders */}
      {recentReminders && recentReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {recentReminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Reminder sent</p>
                    <p className="text-xs text-gray-600">
                      Member ID: {reminder.memberId} • {reminder.daysSinceLastActivity} days inactive
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {new Date(reminder.sentAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      #{reminder.channelName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}