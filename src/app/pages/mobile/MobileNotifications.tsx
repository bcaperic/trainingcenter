import { useNavigate } from "react-router";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useProgram } from "../../context/ProgramContext";
import { useApi, apiPost } from "../../hooks/use-api";
import type { Notification, PaginatedResponse } from "../../types/api";
import {
  Calendar,
  Target,
  BarChart3,
  Video,
  Check,
  ChevronLeft,
  Folder,
} from "lucide-react";
import { EmptyState } from "../../components/EmptyState";

type NotificationType =
  | "SESSION_REMINDER"
  | "MISSION_DUE"
  | "REPORT_GENERATED"
  | "RECORDING_AVAILABLE";

const typeConfig: Record<
  string,
  { icon: typeof Calendar; color: string; bg: string; label: string }
> = {
  SESSION_REMINDER: {
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Session",
  },
  MISSION_DUE: {
    icon: Target,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "Mission",
  },
  REPORT_GENERATED: {
    icon: BarChart3,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Report",
  },
  RECORDING_AVAILABLE: {
    icon: Video,
    color: "text-purple-600",
    bg: "bg-purple-50",
    label: "Recording",
  },
};

const defaultTypeConfig = {
  icon: Calendar,
  color: "text-gray-600",
  bg: "bg-gray-50",
  label: "Info",
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

export function MobileNotifications() {
  const navigate = useNavigate();
  const { currentProgram } = useProgram();
  const pid = currentProgram?.id;

  const {
    data: notifResponse,
    loading,
    refetch,
  } = useApi<PaginatedResponse<Notification> & { meta: { unreadCount?: number } }>(
    pid ? `/programs/${pid}/me/notifications` : null,
    [pid]
  );

  if (!currentProgram) {
    return (
      <div className="p-4">
        <EmptyState
          icon={Folder}
          title="No program selected"
          description="Select a program to view notifications."
        />
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  const notifications = notifResponse?.data ?? [];
  const unreadCount = (notifResponse?.meta as any)?.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    // Mark each unread notification as read
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

  const handleTap = async (notification: Notification) => {
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
    if (notification.linkPath) {
      const mobileLink = notification.linkPath.replace("/learn", "/m");
      navigate(mobileLink);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-accent"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div>
            <h2 className="text-base" style={{ fontWeight: 600 }}>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {unreadCount} unread
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={markAllRead}
          >
            <Check className="size-3.5" />
            Read all
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-12">
          <p className="text-xs text-muted-foreground text-center">
            No notifications yet
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {notifications.map((n) => {
            const config = typeConfig[n.type] ?? defaultTypeConfig;
            const IconComponent = config.icon;
            const isRead = n.isRead;
            return (
              <button
                key={n.id}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 active:bg-accent/50 transition-colors ${
                  !isRead ? "bg-primary/[0.03]" : ""
                }`}
                onClick={() => handleTap(n)}
              >
                <div
                  className={`size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${config.bg}`}
                >
                  <IconComponent className={`size-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className="text-xs"
                      style={{ fontWeight: isRead ? 400 : 500 }}
                    >
                      {n.title}
                    </p>
                    {!isRead && (
                      <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {n.body}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge
                      variant="secondary"
                      className={`text-[9px] px-1 py-0 ${config.bg} ${config.color}`}
                    >
                      {config.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground/70">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
