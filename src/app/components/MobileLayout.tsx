import { NavLink, Outlet } from "react-router";
import { Home, Calendar, ScanLine, Target, User } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useProgram } from "../context/ProgramContext";
import { GraduationCap } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

const tabs = [
  { to: "/m", icon: Home, label: "Home", end: true },
  { to: "/m/schedule", icon: Calendar, label: "Schedule" },
  { to: "/m/checkin", icon: ScanLine, label: "Check-in" },
  { to: "/m/missions", icon: Target, label: "Tests" },
  { to: "/m/profile", icon: User, label: "Profile" },
];

export function MobileLayout() {
  const { currentProgram, setCurrentProgram, allPrograms } = useProgram();

  const statusColor: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    upcoming: "bg-blue-50 text-blue-700",
    completed: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="flex justify-center bg-muted/30 min-h-screen">
      <div className="w-full max-w-md bg-background flex flex-col h-screen relative border-x">
        {/* Top bar — program switcher */}
        <header className="border-b px-3 py-2 flex items-center gap-2 shrink-0 bg-card">
          <GraduationCap className="size-4 text-primary shrink-0" />
          <Select
            value={currentProgram?.id || ""}
            onValueChange={(val) => {
              const prog = allPrograms.find((p) => p.id === val) || null;
              setCurrentProgram(prog);
            }}
          >
            <SelectTrigger size="sm" className="flex-1 h-8 border-dashed text-xs">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {allPrograms.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{p.shortName}</span>
                    <Badge
                      variant="secondary"
                      className={`text-[9px] px-1 py-0 ${statusColor[p.status] || ""}`}
                    >
                      {p.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <NotificationBell basePath="/m" />
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-16">
          <Outlet />
        </div>

        {/* Bottom Tab Bar — fixed */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t z-50">
          <div className="flex items-center justify-around h-14 px-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={"end" in tab ? (tab as any).end : false}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-1 px-2 rounded-md min-w-0 transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`flex items-center justify-center size-7 rounded-lg transition-colors ${
                        isActive ? "bg-primary/10" : ""
                      }`}
                    >
                      <tab.icon
                        className="size-[18px]"
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    </div>
                    <span
                      className="text-[10px] leading-none"
                      style={{ fontWeight: isActive ? 600 : 400 }}
                    >
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
          {/* Safe area bottom spacer */}
          <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </nav>
      </div>
    </div>
  );
}