import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Calendar,
  Target,
  ClipboardCheck,
  BarChart3,
  LogOut,
  GraduationCap,
  Folder,
  Settings,
  Users,
  UsersRound,
  BookOpen,
  CalendarClock,
  Megaphone,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useProgram } from "../context/ProgramContext";
import { useAuth } from "../context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const operationNavItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/admin/schedule", icon: Calendar, label: "Schedule" },
  { to: "/admin/missions", icon: Target, label: "Tests" },
  { to: "/admin/attendance", icon: ClipboardCheck, label: "Attendance" },
  { to: "/admin/reports", icon: BarChart3, label: "Reports" },
];

const cmsNavItems = [
  { to: "/admin/programs", icon: Folder, label: "Programs" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/teams", icon: UsersRound, label: "Teams" },
  { to: "/admin/curriculum", icon: BookOpen, label: "Curriculum" },
  { to: "/admin/sessions", icon: CalendarClock, label: "Sessions" },
  { to: "/admin/announcements", icon: Megaphone, label: "Announcements" },
];

const allNavItems = [...operationNavItems, ...cmsNavItems];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProgram, setCurrentProgram, allPrograms } = useProgram();
  const { user, logout } = useAuth();

  const currentPage = allNavItems.find(
    (item) =>
      item.to === location.pathname ||
      (item.to !== "/admin" && location.pathname.startsWith(item.to))
  );
  const pageTitle = currentPage?.label || "Overview";
  const isCmsPage = cmsNavItems.some(
    (item) =>
      item.to === location.pathname || location.pathname.startsWith(item.to)
  );

  const statusColor: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    upcoming: "bg-blue-50 text-blue-700",
    completed: "bg-gray-100 text-gray-600",
  };

  const renderNavLink = (item: (typeof allNavItems)[number]) => (
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
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-52 border-r bg-card flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <GraduationCap className="size-5 text-primary" />
          <div className="flex flex-col">
            <span className="text-sm tracking-tight" style={{ fontWeight: 600 }}>
              Training Hub
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
              Admin Console
            </span>
          </div>
        </div>
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {/* Operations */}
          <div className="pb-1 px-3 pt-1">
            <span
              className="text-[10px] tracking-wider text-muted-foreground/70 uppercase"
              style={{ fontWeight: 600 }}
            >
              Operations
            </span>
          </div>
          {operationNavItems.map(renderNavLink)}

          {/* CMS */}
          <div className="pt-3 pb-1 px-3">
            <span
              className="text-[10px] tracking-wider text-muted-foreground/70 uppercase"
              style={{ fontWeight: 600 }}
            >
              Manage
            </span>
          </div>
          {cmsNavItems.map(renderNavLink)}
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
                {user?.name || "Admin"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate capitalize">
                {user?.role || "admin"}
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
            <SelectTrigger size="sm" className="w-56 gap-1.5 border-dashed">
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

          {/* Page Title */}
          <div className="flex items-center gap-2">
            {isCmsPage && <Settings className="size-3.5 text-muted-foreground" />}
            <h2 className="text-sm" style={{ fontWeight: 600 }}>
              {pageTitle}
            </h2>
            {currentProgram && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-primary/15"
              >
                {currentProgram.shortName}
              </Badge>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}