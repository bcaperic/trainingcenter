import { useState, useCallback } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../../components/ui/input-otp";
import { useProgram } from "../../context/ProgramContext";
import { useAuth } from "../../context/AuthContext";
import { useApi, apiPost } from "../../hooks/use-api";
import type { Session, PaginatedResponse } from "../../types/api";
import { format, parseISO } from "date-fns";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ScanLine,
  RotateCcw,
} from "lucide-react";

type CheckinState =
  | "idle"
  | "loading"
  | "success"
  | "invalid"
  | "expired"
  | "already"
  | "late";

export function MobileCheckin() {
  const { currentProgram } = useProgram();
  const { user } = useAuth();
  const pid = currentProgram?.id;
  const [code, setCode] = useState("");
  const [state, setState] = useState<CheckinState>("idle");
  const [timestamp, setTimestamp] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  const { data: sessionsData, loading } = useApi<PaginatedResponse<Session>>(
    pid ? `/programs/${pid}/sessions` : null,
    [pid]
  );

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todaySessions = (sessionsData?.data ?? []).filter((s) => {
    try {
      return format(parseISO(s.startAt), "yyyy-MM-dd") === todayStr;
    } catch {
      return false;
    }
  });

  // Auto-select the first ongoing/published session or let user pick
  const currentSession =
    todaySessions.find((s) => s.id === selectedSessionId) ??
    todaySessions.find((s) => s.status === "ONGOING") ??
    todaySessions[0] ??
    null;

  const formatSessionTime = (s: Session) => {
    try {
      const start = format(parseISO(s.startAt), "HH:mm");
      const end = format(parseISO(s.endAt), "HH:mm");
      return `${start}-${end}`;
    } catch {
      return "";
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!currentSession || !pid) return;

    // For CODE mode, require 6-digit code
    if (currentSession.checkinMode === "CODE" && code.length !== 6) return;

    setState("loading");

    try {
      const body =
        currentSession.checkinMode === "CODE" ? { code } : undefined;
      const res = await apiPost<{ status: string }>(
        `/programs/${pid}/sessions/${currentSession.id}/checkin`,
        body
      );

      const now = new Date();
      const ts = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTimestamp(ts);

      // Map backend status to local state
      const statusMap: Record<string, CheckinState> = {
        PRESENT: "success",
        LATE: "late",
        INVALID: "invalid",
        EXPIRED: "expired",
        ALREADY: "already",
      };
      setState(statusMap[res.status] ?? "success");
    } catch (err: any) {
      const now = new Date();
      const ts = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTimestamp(ts);

      const errMsg = err?.response?.data?.code || err?.response?.data?.message || "";
      if (errMsg.includes("INVALID") || errMsg.includes("invalid")) {
        setState("invalid");
      } else if (errMsg.includes("EXPIRED") || errMsg.includes("expired")) {
        setState("expired");
      } else if (errMsg.includes("ALREADY") || errMsg.includes("already")) {
        setState("already");
      } else if (errMsg.includes("LATE") || errMsg.includes("late")) {
        setState("late");
      } else {
        setState("invalid");
      }
    }
  }, [code, currentSession, pid]);

  const handleReset = () => {
    setCode("");
    setState("idle");
    setTimestamp("");
  };

  const stateConfig: Record<
    Exclude<CheckinState, "idle" | "loading">,
    {
      icon: typeof CheckCircle;
      iconColor: string;
      bg: string;
      title: string;
      subtitle: string;
      badgeClass: string;
      badgeText: string;
    }
  > = {
    success: {
      icon: CheckCircle,
      iconColor: "text-green-600",
      bg: "bg-green-50",
      title: "Checked in!",
      subtitle: "You've been marked as present.",
      badgeClass: "bg-green-50 text-green-700",
      badgeText: "Present",
    },
    late: {
      icon: Clock,
      iconColor: "text-amber-600",
      bg: "bg-amber-50",
      title: "Checked in (Late)",
      subtitle: "You've been marked as late.",
      badgeClass: "bg-amber-50 text-amber-700",
      badgeText: "Late",
    },
    invalid: {
      icon: XCircle,
      iconColor: "text-red-500",
      bg: "bg-red-50",
      title: "Invalid Code",
      subtitle: "The code you entered is incorrect.",
      badgeClass: "bg-red-50 text-red-600",
      badgeText: "Error",
    },
    expired: {
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      bg: "bg-amber-50",
      title: "Code Expired",
      subtitle: "This check-in code is no longer valid.",
      badgeClass: "bg-amber-50 text-amber-700",
      badgeText: "Expired",
    },
    already: {
      icon: CheckCircle,
      iconColor: "text-blue-500",
      bg: "bg-blue-50",
      title: "Already Checked In",
      subtitle: "You've already checked in for this session.",
      badgeClass: "bg-blue-50 text-blue-700",
      badgeText: "Duplicate",
    },
  };

  const showResult = state !== "idle" && state !== "loading";
  const config = showResult ? stateConfig[state] : null;
  const ResultIcon = config?.icon ?? CheckCircle;

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-base" style={{ fontWeight: 600 }}>
          Check-in
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {currentProgram?.shortName ?? "No program"}
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Current Session Card */}
        {currentSession && (
          <div className="border rounded-lg p-3 flex items-center gap-3">
            <div
              className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                currentSession.type === "LIVE"
                  ? "bg-blue-50"
                  : "bg-green-50"
              }`}
            >
              <Clock
                className={`size-4 ${
                  currentSession.type === "LIVE"
                    ? "text-blue-600"
                    : "text-green-600"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate" style={{ fontWeight: 500 }}>
                {currentSession.title}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatSessionTime(currentSession)} ·{" "}
                {currentSession.locationOrUrl ?? ""}
              </p>
            </div>
          </div>
        )}

        {/* Check-in Card */}
        {!showResult ? (
          <div className="border rounded-xl p-5 space-y-5 bg-card">
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ScanLine className="size-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm" style={{ fontWeight: 600 }}>
                  {currentSession?.checkinMode === "BUTTON"
                    ? "Tap to Check In"
                    : "Enter Check-in Code"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {currentSession?.checkinMode === "BUTTON"
                    ? "Press the button below to check in"
                    : "6-digit code from your instructor"}
                </p>
              </div>
            </div>

            {/* OTP Input — only for CODE mode */}
            {currentSession?.checkinMode !== "BUTTON" && (
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="size-11 text-base" />
                    <InputOTPSlot index={1} className="size-11 text-base" />
                    <InputOTPSlot index={2} className="size-11 text-base" />
                    <InputOTPSlot index={3} className="size-11 text-base" />
                    <InputOTPSlot index={4} className="size-11 text-base" />
                    <InputOTPSlot index={5} className="size-11 text-base" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}

            <Button
              className="w-full h-11 text-sm"
              onClick={handleSubmit}
              disabled={
                (!currentSession) ||
                (currentSession.checkinMode === "CODE" && code.length !== 6) ||
                state === "loading"
              }
            >
              {state === "loading" ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        ) : (
          /* Result Card */
          <div className="border rounded-xl p-5 space-y-4 bg-card">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`size-14 rounded-full ${config!.bg} flex items-center justify-center`}
              >
                <ResultIcon className={`size-7 ${config!.iconColor}`} />
              </div>
              <div className="text-center">
                <p className="text-sm" style={{ fontWeight: 600 }}>
                  {config!.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {config!.subtitle}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="border rounded-lg divide-y">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-[11px] text-muted-foreground">
                  Status
                </span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${config!.badgeClass}`}
                >
                  {config!.badgeText}
                </Badge>
              </div>
              {timestamp && (
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-[11px] text-muted-foreground">
                    Timestamp
                  </span>
                  <span className="text-xs" style={{ fontWeight: 500 }}>
                    {timestamp}
                  </span>
                </div>
              )}
              {currentSession && (
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-[11px] text-muted-foreground">
                    Session
                  </span>
                  <span
                    className="text-xs text-right max-w-[55%] truncate"
                    style={{ fontWeight: 500 }}
                  >
                    {currentSession.title}
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full h-10 text-sm gap-1.5"
              onClick={handleReset}
            >
              <RotateCcw className="size-4" />
              {state === "success" || state === "late" || state === "already"
                ? "Done"
                : "Try Again"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
