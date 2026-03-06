import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  Home,
  Calendar,
  Target,
  TrendingUp,
  User,
  LogOut,
  GraduationCap,
  Folder,
  Video,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useProgram } from "../context/ProgramContext";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "./NotificationBell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const navItems = [
  { to: "/learn", icon: Home, label: "Home", end: true },
  { to: "/learn/schedule", icon: Calendar, label: "Schedule" },
  { to: "/learn/missions", icon: Target, label: "Tests" },
  { to: "/learn/recordings", icon: Video, label: "Recordings" },
  { to: "/learn/progress", icon: TrendingUp, label: "Progress" },
  { to: "/learn/profile", icon: User, label: "Profile" },
];

export function LearnerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProgram, setCurrentProgram, allPrograms } = useProgram();
  const { user, logout } = useAuth();

  const currentPage = navItems.find(
    (item) =>
      item.to === location.pathname ||
      (item.to !== "/learn" && location.pathname.startsWith(item.to))
  );
  const pageTitle = currentPage?.label || "Home";

  const statusColor: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    upcoming: "bg-blue-50 text-blue-700",
    completed: "bg-gray-100 text-gray-600",
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — compact */}
      <aside className="w-48 border-r bg-card flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <GraduationCap className="size-5 text-primary" />
          <div className="flex flex-col">
            <span className="text-sm tracking-tight" style={{ fontWeight: 600 }}>
              Training Hub
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
              Learning Center
            </span>
          </div>
        </div>
        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={"end" in item ? (item as any).end : false}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`
              }
              style={{ fontWeight: 500 }}
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t">
          <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
            <div
              className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary"
              style={{ fontWeight: 600 }}
            >
              {user?.initials || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate" style={{ fontWeight: 500 }}>
                {user?.name || "Trainee"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.team || "Team"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground text-xs"
            onClick={handleLogout}
          >
            <LogOut className="size-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b px-4 py-2 flex items-center gap-3 shrink-0">
          {/* Program Switcher */}
          <Select
            value={currentProgram?.id || ""}
            onValueChange={(val) => {
              const prog = allPrograms.find((p) => p.id === val) || null;
              setCurrentProgram(prog);
            }}
          >
            <SelectTrigger size="sm" className="w-52 gap-1.5 border-dashed">
              <Folder className="size-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {allPrograms.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span>{p.shortName}</span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1 py-0 ${statusColor[p.status] || ""}`}
                    >
                      {p.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-4 w-px bg-border" />

          <h2 className="text-sm" style={{ fontWeight: 600 }}>
            {pageTitle}
          </h2>

          <div className="flex-1" />

          <NotificationBell basePath="/learn" />
        </header>
        <div className="flex-1 overflow-auto p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}