import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { GraduationCap } from "lucide-react";
import { useAuth, UserRole } from "../context/AuthContext";

const redirectMap: Record<UserRole, string> = {
  admin: "/admin",
  instructor: "/admin",
  trainee: "/learn",
};

export function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (user) {
    navigate(redirectMap[user.role], { replace: true });
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { role } = await login(email, password);
      navigate(redirectMap[role]);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm bg-card border rounded-lg p-6 space-y-5">
        <div className="flex flex-col items-center gap-2">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="size-5 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-base" style={{ fontWeight: 600 }}>
              Training Hub
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sign in to your learning platform
            </p>
          </div>
        </div>

        <form onSubmit={handleSignIn} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Email</label>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 text-sm"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Password</label>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-8 text-sm"
              required
            />
          </div>
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full h-8 text-sm" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <div className="flex justify-between text-xs text-muted-foreground">
            <Link to="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
            <Link to="/signup" className="text-primary hover:underline">
              Create account
            </Link>
          </div>
        </form>

        {/* Test accounts */}
        <div className="border-t pt-3 space-y-1.5">
          <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider" style={{ fontWeight: 600 }}>
            Test Accounts
          </p>
          <div className="space-y-1">
            {[
              { role: "Admin", email: "eric.yoon@bccard-ap.com", pw: "admin123" },
              { role: "Admin", email: "admin.park@company.com", pw: "password123" },
              { role: "Instructor", email: "felix@company.com", pw: "password123" },
              { role: "Trainee", email: "nguyen.a@company.com", pw: "password123" },
            ].map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="w-full text-left px-2.5 py-1.5 rounded-md border border-dashed hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => { setEmail(acc.email); setPassword(acc.pw); }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground" style={{ fontWeight: 600 }}>
                    {acc.role}
                  </span>
                  <span className="text-xs text-foreground truncate">{acc.email}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
