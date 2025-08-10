import { useQuery } from "@tanstack/react-query";
import { StatsCards } from "@/components/stats-cards";
import { RecentActivity } from "@/components/recent-activity";
import { InactiveUsers } from "@/components/inactive-users";
import { ActivityTable } from "@/components/activity-table";

export default function Dashboard() {
  const { data: memberStats } = useQuery<{
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    remindersSentToday: number;
  }>({
    queryKey: ["/api/members/stats"],
    refetchInterval: 30000,
  });

  const formatLastCheck = () => {
    return new Date().toLocaleString();
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Activity Dashboard</h2>
            <p className="text-gray-600">Monitor Discord server member activity and engagement</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Check</p>
              <p className="font-medium text-gray-900">{formatLastCheck()}</p>
            </div>
            <div className="w-8 h-8 bg-discord-100 rounded-full flex items-center justify-center">
              <i className="fas fa-user text-discord-600"></i>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <StatsCards stats={memberStats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RecentActivity />
          <InactiveUsers />
        </div>

        <ActivityTable />
      </main>
    </>
  );
}
