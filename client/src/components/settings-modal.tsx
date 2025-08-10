import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SettingsModalProps {
  onClose: () => void;
}

interface BotSettings {
  id: string;
  discordToken: string | null;
  serverId: string | null;
  inactivityThreshold: number;
  reminderCooldown: number;
  rateLimitMinutes: number;
  reminderTemplate: string;
  isActive: boolean;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery<BotSettings>({
    queryKey: ["/api/settings"],
  });

  const [formData, setFormData] = useState({
    discordToken: "",
    serverId: "",
    inactivityThreshold: 14,
    reminderCooldown: 3,
    rateLimitMinutes: 10,
    reminderTemplate: "Hey {user}! 👋 We noticed you haven't been active for {days} days. We miss you in the server! Come say hi when you get a chance. 😊",
  });

  // Update form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        discordToken: settings.discordToken || "",
        serverId: settings.serverId || "",
        inactivityThreshold: settings.inactivityThreshold,
        reminderCooldown: settings.reminderCooldown,
        rateLimitMinutes: settings.rateLimitMinutes,
        reminderTemplate: settings.reminderTemplate,
      });
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("PUT", "/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bot/status"] });
      toast({
        title: "Settings Saved",
        description: "Bot settings have been updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discord-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading settings...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto" data-testid="settings-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bot Settings</span>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-settings">
              <i className="fas fa-times"></i>
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Discord Configuration */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Discord Configuration</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="discordToken" className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Token
                </Label>
                <div className="relative">
                  <Input
                    id="discordToken"
                    type="password"
                    value={formData.discordToken}
                    onChange={(e) => handleInputChange("discordToken", e.target.value)}
                    placeholder="Enter your Discord bot token"
                    className="pr-10"
                    data-testid="input-discord-token"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => {
                      const input = document.getElementById("discordToken") as HTMLInputElement;
                      input.type = input.type === "password" ? "text" : "password";
                    }}
                  >
                    <i className="fas fa-eye text-gray-400 hover:text-gray-600"></i>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Your Discord bot token. Keep this secure!</p>
              </div>
              
              <div>
                <Label htmlFor="serverId" className="block text-sm font-medium text-gray-700 mb-2">
                  Server ID
                </Label>
                <Input
                  id="serverId"
                  type="text"
                  value={formData.serverId}
                  onChange={(e) => handleInputChange("serverId", e.target.value)}
                  placeholder="Enter your Discord server ID"
                  data-testid="input-server-id"
                />
              </div>
            </div>
          </div>

          {/* Activity Monitoring Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Activity Monitoring</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="inactivityThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                  Inactivity Threshold (days)
                </Label>
                <Input
                  id="inactivityThreshold"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.inactivityThreshold}
                  onChange={(e) => handleInputChange("inactivityThreshold", parseInt(e.target.value) || 14)}
                  data-testid="input-inactivity-threshold"
                />
                <p className="text-xs text-gray-500 mt-1">Send reminders after this many days of inactivity</p>
              </div>
              
              <div>
                <Label htmlFor="reminderCooldown" className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Cooldown (days)
                </Label>
                <Input
                  id="reminderCooldown"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.reminderCooldown}
                  onChange={(e) => handleInputChange("reminderCooldown", parseInt(e.target.value) || 3)}
                  data-testid="input-reminder-cooldown"
                />
                <p className="text-xs text-gray-500 mt-1">Wait this long before sending another reminder to the same user</p>
              </div>
              
              <div>
                <Label htmlFor="rateLimitMinutes" className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Limit (minutes)
                </Label>
                <Input
                  id="rateLimitMinutes"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.rateLimitMinutes}
                  onChange={(e) => handleInputChange("rateLimitMinutes", parseInt(e.target.value) || 10)}
                  data-testid="input-rate-limit"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum time between any reminder messages</p>
              </div>
            </div>
          </div>

          {/* Reminder Message Template */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Reminder Message</h4>
            <div>
              <Label htmlFor="reminderTemplate" className="block text-sm font-medium text-gray-700 mb-2">
                Message Template
              </Label>
              <Textarea
                id="reminderTemplate"
                rows={4}
                value={formData.reminderTemplate}
                onChange={(e) => handleInputChange("reminderTemplate", e.target.value)}
                placeholder="Enter reminder message template..."
                data-testid="textarea-reminder-template"
              />
              <p className="text-xs text-gray-500 mt-1">Use {"{user}"} for user mention and {"{days}"} for inactive days count</p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-settings">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saveSettingsMutation.isPending}
              className="bg-discord-500 hover:bg-discord-600"
              data-testid="button-save-settings"
            >
              {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
