interface StatsCardsProps {
  stats?: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    remindersSentToday: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const activePercentage = stats ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Members</p>
            <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="stat-total-members">
              {stats?.totalMembers || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i className="fas fa-users text-blue-600 text-xl"></i>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-green-600 text-sm font-medium">Server members</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Users</p>
            <p className="text-3xl font-bold text-green-600 mt-2" data-testid="stat-active-users">
              {stats?.activeMembers || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <i className="fas fa-chart-line text-green-600 text-xl"></i>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-gray-600 text-sm">{activePercentage}% of total</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Inactive (2+ weeks)</p>
            <p className="text-3xl font-bold text-red-600 mt-2" data-testid="stat-inactive-users">
              {stats?.inactiveMembers || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <i className="fas fa-user-clock text-red-600 text-xl"></i>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-red-600 text-sm font-medium">Need reminders</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Reminders Sent</p>
            <p className="text-3xl font-bold text-orange-600 mt-2" data-testid="stat-reminders-sent">
              {stats?.remindersSentToday || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <i className="fas fa-bell text-orange-600 text-xl"></i>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-gray-600 text-sm">Today</span>
        </div>
      </div>
    </div>
  );
}
