import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { riderApi } from "../services/riderApi";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [demoToken, setDemoToken] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setDemoToken("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setPending(true);
    try {
      const result = await riderApi.requestPasswordReset(email);
      setMessage(result.message);
      setDemoToken(result.resetToken ?? "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The reset email could not be sent.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="screen auth-screen">
      <AuthTopBar title="Forgot password" onBack={() => navigate("/login")} />
      <section className="auth-screen__intro">
        <p className="brand">ESANA</p>
        <h1>Reset your password</h1>
        <p>Enter the email address linked to your rider account. We’ll send you a secure reset link.</p>
      </section>

      {!message ? (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="rider@esana.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(error)}
            />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      ) : (
        <section className="reset-sent" role="status">
          <span className="reset-sent__symbol" aria-hidden="true">@</span>
          <h2>Check your email</h2>
          <p>{message}</p>
          <p className="reset-sent__email">{email.trim()}</p>
          {demoToken ? (
            <Button onClick={() => navigate(`/reset-password?token=${encodeURIComponent(demoToken)}`)}>
              Open demo reset link
            </Button>
          ) : null}
          <button className="text-button text-button--center" onClick={() => setMessage("")}>
            Use another email
          </button>
        </section>
      )}

      <p className="auth-screen__footer">
        Remembered your password? <Link to="/login">Back to sign in</Link>
      </p>
    </main>
  );
}

export function AuthTopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="top-bar auth-top-bar">
      <button className="icon-button" onClick={onBack} aria-label="Back">
        <img src="/assets/back.svg" alt="" width="24" height="24" />
      </button>
      <h1>{title}</h1>
    </header>
  );
}
