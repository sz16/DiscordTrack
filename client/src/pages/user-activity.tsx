import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Member {
  id: string;
  username: string;
  displayName: string | null;
  status: string;
  lastActivity: string | null;
  messagesThisWeek: number;
  voiceTimeThisWeek: number;
  totalMessages: number;
  totalVoiceTime: number;
  joinedAt: string;
}

export default function UserActivity() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
    refetchInterval: 30000,
  });

  const filteredMembers = members?.filter(member => {
    const matchesSearch = member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-green-100 text-green-800 border-green-200";
      case 'very_inactive':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const formatLastActivity = (lastActivity: string | null) => {
    if (!lastActivity) return "Never";
    return new Date(lastActivity).toLocaleDateString();
  };

  const formatVoiceTime = (minutes: number) => {
    if (minutes === 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) return `${remainingMinutes}m`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getInitials = (username: string, displayName?: string | null) => {
    const name = displayName || username;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Activity</h1>
        <p className="text-gray-600 mt-2">Detailed view of individual member activity and engagement</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                data-testid="input-search-members"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="very_inactive">Very Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow" data-testid={`member-card-${member.id}`}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="w-12 h-12 bg-discord-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-sm font-medium text-discord-600">
                  {getInitials(member.username, member.displayName)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900" data-testid={`member-username-${member.id}`}>
                  @{member.username}
                </h3>
                {member.displayName && (
                  <p className="text-sm text-gray-500" data-testid={`member-displayname-${member.id}`}>
                    {member.displayName}
                  </p>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(member.status)}`}>
                {member.status.replace('_', ' ')}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Messages (7d)</p>
                  <p className="font-medium" data-testid={`member-messages-${member.id}`}>
                    {member.messagesThisWeek}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Voice Time (7d)</p>
                  <p className="font-medium" data-testid={`member-voice-time-${member.id}`}>
                    {formatVoiceTime(member.voiceTimeThisWeek)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total Messages</p>
                  <p className="font-medium">{member.totalMessages}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total Voice</p>
                  <p className="font-medium">{formatVoiceTime(member.totalVoiceTime)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Last Activity</span>
                  <span className="font-medium" data-testid={`member-last-activity-${member.id}`}>
                    {formatLastActivity(member.lastActivity)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-gray-500">Joined</span>
                  <span className="font-medium">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button 
                className="w-full" 
                variant="outline" 
                size="sm"
                data-testid={`button-view-details-${member.id}`}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-users text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}