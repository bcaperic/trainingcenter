import { useNavigate } from "react-router";
import { Bell, Calendar, Target, BarChart3, Video, Check } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { useState } from "react";
import { useProgram } from "../context/ProgramContext";
import { useApi, apiPost } from "../hooks/use-api";
import type { Notification, PaginatedResponse } from "../types/api";

const typeConfig: Record<
  string,
  { icon: typeof Calendar; color: string; bg: string }
> = {
  SESSION_REMINDER: {
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  MISSION_DUE: {
    icon: Target,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  REPORT_GENERATED: {
    icon: BarChart3,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  RECORDING_AVAILABLE: {
    icon: Video,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
};

const defaultTypeConfig = {
  icon: Calendar,
  color: "text-gray-600",
  bg: "bg-gray-50",
};

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

interface NotificationBellProps {
  basePath?: string; // "/learn" or "/m"
}

export function NotificationBell({
  basePath = "/learn",
}: NotificationBellProps) {
  const navigate = useNavigate();
  const { currentProgram } = useProgram();
  const pid = currentProgram?.id;
  const [open, setOpen] = useState(false);

  const { data: notifResponse, refetch } = useApi<
    PaginatedResponse<Notification> & { meta: { unreadCount?: number } }
  >(pid ? `/programs/${pid}/me/notifications` : null, [pid]);

  const notifications = notifResponse?.data ?? [];
  const unreadCount =
    (notifResponse?.meta as any)?.unreadCount ??
    notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    try {
      await Promise.all(
        unread.map((n) =>
          apiPost(`/programs/${pid}/me/notifications/${n.id}/read`)
        )
      );
      refetch();
    } catch {
      // Silently fail
    }
  };

  const handleClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await apiPost(
          `/programs/${pid}/me/notifications/${notification.id}/read`
        );
        refetch();
      } catch {
        // Silently fail
      }
    }
    // Navigate
    const linkTo = notification.linkPath;
    const resolvedLink =
      basePath === "/m" ? linkTo.replace("/learn", "/m") : linkTo;
    setOpen(false);
    navigate(resolvedLink);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative size-8 p-0">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center"
              style={{ fontWeight: 600 }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="px-3 py-2 border-b flex items-center justify-between">
          <h4 className="text-xs" style={{ fontWeight: 600 }}>
            Notifications
          </h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] text-muted-foreground gap-1 px-1.5"
              onClick={markAllRead}
            >
              <Check className="size-3" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No notifications
            </p>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const config = typeConfig[n.type] ?? defaultTypeConfig;
                const IconComponent = config.icon;
                const isRead = n.isRead;
                return (
                  <button
                    key={n.id}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-accent/50 transition-colors ${
                      !isRead ? "bg-primary/[0.03]" : ""
                    }`}
                    onClick={() => handleClick(n)}
                  >
                    <div
                      className={`size-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${config.bg}`}
                    >
                      <IconComponent
                        className={`size-3.5 ${config.color}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className="text-xs truncate"
                          style={{ fontWeight: isRead ? 400 : 500 }}
                        >
                          {n.title}
                        </p>
                        {!isRead && (
                          <span className="size-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
