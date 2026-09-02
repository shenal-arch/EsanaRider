import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import type { RiderSession } from "../types";
import { getRememberedIdentifier, riderApi } from "../services/riderApi";

interface LoginPageProps {
  session: RiderSession | null;
  onAuthenticated: (session: RiderSession) => void;
}

export function LoginPage({ session, onAuthenticated }: LoginPageProps) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(() => getRememberedIdentifier());
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => Boolean(getRememberedIdentifier()));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (session) return <Navigate to="/deliveries" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Enter your email or mobile number and password.");
      return;
    }

    setPending(true);
    try {
      const authenticated = await riderApi.login({ identifier, password, rememberMe });
      onAuthenticated(authenticated);
      navigate("/deliveries", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="screen login-screen">
      <header className="login-screen__header">
        <p className="brand">ESANA</p>
        <p className="product-label">RIDER DELIVERY</p>
        <h1>Welcome back</h1>
        <p>Sign in to view your assigned deliveries.</p>
      </header>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>Email or mobile number</span>
          <input
            type="text"
            name="identifier"
            autoComplete="username"
            inputMode="email"
            placeholder="rider@esana.com"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            aria-invalid={Boolean(error)}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(error)}
          />
        </label>
        <div className="login-options">
          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="security-note">Secure access · OTP and lockout rules apply</p>
    </main>
  );
}
