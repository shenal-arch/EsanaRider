import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { riderApi } from "../services/riderApi";
import { AuthTopBar } from "./ForgotPasswordPage";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This password reset link is incomplete. Request a new link.");
      return;
    }
    if (password.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setPending(true);
    try {
      await riderApi.resetPassword({ token, newPassword: password });
      setComplete(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your password could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="screen auth-screen">
      <AuthTopBar title="Reset password" onBack={() => navigate("/login")} />

      {!complete ? (
        <>
          <section className="auth-screen__intro">
            <p className="brand">ESANA</p>
            <h1>Create a new password</h1>
            <p>Choose a secure password that you haven’t used for this rider account before.</p>
          </section>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="Enter your new password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(error)}
              />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-invalid={Boolean(error)}
              />
            </label>
            <p className="password-hint">Use at least 8 characters.</p>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Updating…" : "Update password"}
            </Button>
          </form>
        </>
      ) : (
        <section className="reset-sent reset-complete" role="status">
          <span className="reset-sent__symbol reset-sent__symbol--check" aria-hidden="true">✓</span>
          <h1>Password updated</h1>
          <p>Your password has been changed successfully. You can now sign in with the new password.</p>
          <Button onClick={() => navigate("/login", { replace: true })}>Back to sign in</Button>
        </section>
      )}

      {!complete ? (
        <p className="auth-screen__footer">Need a new link? <Link to="/forgot-password">Request another</Link></p>
      ) : null}
    </main>
  );
}
