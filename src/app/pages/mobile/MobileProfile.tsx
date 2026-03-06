import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useAuth } from "../../context/AuthContext";
import { useProgram } from "../../context/ProgramContext";
import {
  User,
  Mail,
  UsersRound,
  Shield,
  LogOut,
  Bell,
  BellOff,
  Globe,
  GraduationCap,
} from "lucide-react";

export function MobileProfile() {
  const { user, logout } = useAuth();
  const { currentProgram } = useProgram();
  const navigate = useNavigate();

  const [sessionReminder, setSessionReminder] = useState(true);
  const [deadlineAlert, setDeadlineAlert] = useState(true);
  const [checkinNotif, setCheckinNotif] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-base" style={{ fontWeight: 600 }}>
          Profile
        </h2>
      </div>

      <div className="px-4 space-y-4 pb-6">
        {/* User Card */}
        <div className="border rounded-xl p-4 flex items-center gap-3">
          <div
            className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-sm text-primary"
            style={{ fontWeight: 600 }}
          >
            {user?.initials || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm" style={{ fontWeight: 600 }}>
              {user?.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user?.email}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="text-[10px] bg-green-50 text-green-700 capitalize shrink-0"
          >
            {user?.role}
          </Badge>
        </div>

        {/* Details */}
        <div className="border rounded-lg divide-y">
          <div className="px-3 py-3 flex items-center gap-3">
            <User className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Full Name</p>
              <p className="text-xs" style={{ fontWeight: 500 }}>
                {user?.name}
              </p>
            </div>
          </div>
          <div className="px-3 py-3 flex items-center gap-3">
            <Mail className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Email</p>
              <p className="text-xs" style={{ fontWeight: 500 }}>
                {user?.email}
              </p>
            </div>
          </div>
          <div className="px-3 py-3 flex items-center gap-3">
            <Shield className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Role</p>
              <p className="text-xs capitalize" style={{ fontWeight: 500 }}>
                {user?.role}
              </p>
            </div>
          </div>
          <div className="px-3 py-3 flex items-center gap-3">
            <UsersRound className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Team</p>
              <p className="text-xs" style={{ fontWeight: 500 }}>
                {user?.team}
              </p>
            </div>
          </div>
          <div className="px-3 py-3 flex items-center gap-3">
            <GraduationCap className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Program</p>
              <p className="text-xs" style={{ fontWeight: 500 }}>
                {currentProgram?.name ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <p
            className="text-xs text-muted-foreground mb-2 px-1"
            style={{ fontWeight: 500 }}
          >
            Notifications
          </p>
          <div className="border rounded-lg divide-y">
            <div className="px-3 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs" style={{ fontWeight: 500 }}>
                    Session Reminders
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    30 min before session
                  </p>
                </div>
              </div>
              <Switch
                checked={sessionReminder}
                onCheckedChange={setSessionReminder}
              />
            </div>
            <div className="px-3 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs" style={{ fontWeight: 500 }}>
                    Deadline Alerts
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    1 day before due
                  </p>
                </div>
              </div>
              <Switch
                checked={deadlineAlert}
                onCheckedChange={setDeadlineAlert}
              />
            </div>
            <div className="px-3 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BellOff className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs" style={{ fontWeight: 500 }}>
                    Check-in Confirmations
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    After successful check-in
                  </p>
                </div>
              </div>
              <Switch
                checked={checkinNotif}
                onCheckedChange={setCheckinNotif}
              />
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <p
            className="text-xs text-muted-foreground mb-2 px-1"
            style={{ fontWeight: 500 }}
          >
            Settings
          </p>
          <div className="border rounded-lg px-3 py-3 flex items-center gap-2.5">
            <Globe className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ fontWeight: 500 }}>
                Timezone
              </p>
            </div>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger size="sm" className="w-44 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Ho_Chi_Minh">
                  Asia/Ho Chi Minh (UTC+7)
                </SelectItem>
                <SelectItem value="Asia/Seoul">
                  Asia/Seoul (UTC+9)
                </SelectItem>
                <SelectItem value="Asia/Jakarta">
                  Asia/Jakarta (UTC+7)
                </SelectItem>
                <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-10 text-sm gap-2 text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
