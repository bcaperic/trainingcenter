import { Navigate, Outlet } from "react-router";
import { useAuth, UserRole } from "../context/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the correct area based on role
    const roleRedirect: Record<UserRole, string> = {
      admin: "/admin",
      instructor: "/admin",
      trainee: "/learn",
    };
    return <Navigate to={roleRedirect[user.role]} replace />;
  }

  return <Outlet />;
}
