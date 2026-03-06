import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { useAuth } from "../../context/AuthContext";
import { useProgram } from "../../context/ProgramContext";
import { User, Mail, UsersRound, GraduationCap, Shield } from "lucide-react";

export function LearnerProfile() {
  const { user } = useAuth();
  const { allPrograms, loading } = useProgram();

  // Programs the user is enrolled in, based on their memberships
  const enrolledPrograms = allPrograms.filter((p) =>
    user?.memberships?.some((m) => m.programId === p.id)
  );

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Profile Card */}
      <Card className="gap-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-sm text-primary"
              style={{ fontWeight: 600 }}
            >
              {user?.initials || "?"}
            </div>
            <div>
              <p className="text-sm" style={{ fontWeight: 600 }}>
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="gap-0">
        <div className="px-3 py-2 border-b">
          <h4 className="text-xs" style={{ fontWeight: 600 }}>
            Account Details
          </h4>
        </div>
        <CardContent className="p-0 divide-y">
          <div className="px-3 py-2.5 flex items-center gap-3">
            <User className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground">Full Name</p>
              <p className="text-xs" style={{ fontWeight: 500 }}>
                {user?.name}
              </p>
            </div>
          </div>
          <div className="px-3 py-2.5 flex items-center gap-3">
            <Mail className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground">Email</p>
              <p className="text-xs" style={{ fontWeight: 500 }}>
                {user?.email}
              </p>
            </div>
          </div>
          <div className="px-3 py-2.5 flex items-center gap-3">
            <Shield className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground">Role</p>
              <p className="text-xs capitalize" style={{ fontWeight: 500 }}>
                {user?.role}
              </p>
            </div>
          </div>
          <div className="px-3 py-2.5 flex items-center gap-3">
            <UsersRound className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground">Team</p>
              <p className="text-xs" style={{ fontWeight: 500 }}>
                {user?.team || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrolled Programs */}
      <Card className="gap-0">
        <div className="px-3 py-2 border-b">
          <h4 className="text-xs" style={{ fontWeight: 600 }}>
            Enrolled Programs
          </h4>
        </div>
        <CardContent className="p-0">
          {enrolledPrograms.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              Not enrolled in any programs
            </p>
          ) : (
            <div className="divide-y">
              {enrolledPrograms.map((p) => {
                const membership = user?.memberships?.find(
                  (m) => m.programId === p.id
                );
                return (
                  <div
                    key={p.id}
                    className="px-3 py-2.5 flex items-center gap-3"
                  >
                    <GraduationCap className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ fontWeight: 500 }}>
                        {p.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {p.duration} · {membership?.role ?? "—"}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${
                        p.status === "ACTIVE"
                          ? "bg-green-50 text-green-700"
                          : p.status === "DRAFT"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.status.toLowerCase()}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
