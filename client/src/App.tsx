import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import Dashboard from "@/pages/dashboard";
import UserActivity from "@/pages/user-activity";
import ActivityLogs from "@/pages/activity-logs";
import Reminders from "@/pages/reminders";
import NotFound from "@/pages/not-found";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SettingsModal } from "@/components/settings-modal";

function AppContent() {
  const [showSettings, setShowSettings] = useState(false);
  
  const { data: botStatus } = useQuery<{
    isReady: boolean;
    isConnected: boolean;
    memberCount: number;
    isActive: boolean;
  }>({
    queryKey: ["/api/bot/status"],
    refetchInterval: 5000,
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        botStatus={botStatus} 
        onOpenSettings={() => setShowSettings(true)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/user-activity" component={UserActivity} />
          <Route path="/activity-logs" component={ActivityLogs} />
          <Route path="/reminders" component={Reminders} />
          <Route component={NotFound} />
        </Switch>
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

function Router() {
  return <AppContent />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
