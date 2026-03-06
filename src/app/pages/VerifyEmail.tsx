import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { GraduationCap } from "lucide-react";
import api from "../lib/api-client";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Missing verification token.");
      setLoading(false);
      return;
    }
    api
      .post("/auth/verify-email", { token })
      .then(({ data }) => setMessage(data.message))
      .catch((err) => setError(err.response?.data?.message || "Verification failed."))
      .finally(() => setLoading(false));
  }, [token]);

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
              Email Verification
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-center text-muted-foreground">Verifying...</p>
        ) : error ? (
          <p className="text-sm text-center text-destructive">{error}</p>
        ) : (
          <p className="text-sm text-center text-green-600">{message}</p>
        )}

        <Link to="/login">
          <Button variant="outline" className="w-full h-8 text-sm">
            Go to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
