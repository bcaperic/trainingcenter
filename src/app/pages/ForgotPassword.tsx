import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { GraduationCap } from "lucide-react";
import api from "../lib/api-client";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSuccess(data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || "Request failed.");
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
              Reset your password
            </p>
          </div>
        </div>

        {success ? (
          <div className="space-y-3">
            <p className="text-sm text-green-600 text-center">{success}</p>
            <p className="text-xs text-muted-foreground text-center">
              Check Admin &gt; Mail Log (Dev Mailbox) for reset link.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full h-8 text-sm mt-2">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
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
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full h-8 text-sm" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Remember your password?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
