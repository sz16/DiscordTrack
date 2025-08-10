import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Member {
  id: string;
  username: string;
  displayName: string | null;
  status: string;
  lastActivity: string | null;
  messagesThisWeek: number;
  voiceTimeThisWeek: number;
  joinedAt: string;
}

export function ActivityTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return {
          className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800",
          text: "Active",
          dotColor: "bg-green-500"
        };
      case 'very_inactive':
        return {
          className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800",
          text: "Very Inactive",
          dotColor: "bg-red-500"
        };
      default:
        return {
          className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800",
          text: "Inactive",
          dotColor: "bg-yellow-500"
        };
    }
  };

  const formatLastActivity = (lastActivity: string | null) => {
    if (!lastActivity) return "Never";
    
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Member Activity Classification</h3>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discord-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading member data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Member Activity Classification</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Active (recent activity)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Inactive (no recent activity)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Very Inactive (2+ weeks)</span>
              </div>
            </div>
            <Button variant="outline" size="sm" data-testid="button-export">
              <i className="fas fa-download mr-2"></i>
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <Input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-members"
              />
            </div>
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
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Messages (7d)</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Voice Time (7d)</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Server</th>
              <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200" data-testid="members-table-body">
            {paginatedMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  <i className="fas fa-users text-2xl mb-2 block"></i>
                  No members found
                </td>
              </tr>
            ) : (
              paginatedMembers.map((member) => {
                const statusBadge = getStatusBadge(member.status);
                return (
                  <tr key={member.id} className="hover:bg-gray-50" data-testid={`member-row-${member.id}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-discord-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-discord-600" data-testid={`member-initials-${member.id}`}>
                            {getInitials(member.username, member.displayName)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900" data-testid={`member-username-${member.id}`}>
                            @{member.username}
                          </p>
                          {member.displayName && (
                            <p className="text-xs text-gray-500" data-testid={`member-displayname-${member.id}`}>
                              {member.displayName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={statusBadge.className} data-testid={`member-status-${member.id}`}>
                        <div className={`w-1.5 h-1.5 ${statusBadge.dotColor} rounded-full mr-1`}></div>
                        {statusBadge.text}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900" data-testid={`member-last-activity-${member.id}`}>
                      {formatLastActivity(member.lastActivity)}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900" data-testid={`member-messages-${member.id}`}>
                      {member.messagesThisWeek}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900" data-testid={`member-voice-time-${member.id}`}>
                      {formatVoiceTime(member.voiceTimeThisWeek)}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500" data-testid={`member-joined-${member.id}`}>
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-discord-600 hover:text-discord-900 text-sm font-medium"
                          data-testid={`button-view-${member.id}`}
                        >
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-600 hover:text-gray-900 text-sm"
                          data-testid={`button-remind-${member.id}`}
                        >
                          <i className="fas fa-bell"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-700">
            Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> of{' '}
            <span className="font-medium">{filteredMembers.length}</span> members
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              data-testid="button-previous-page"
            >
              <i className="fas fa-chevron-left"></i>
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  data-testid={`button-page-${page}`}
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              data-testid="button-next-page"
            >
              <i className="fas fa-chevron-right"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
