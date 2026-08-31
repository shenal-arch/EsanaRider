import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoadingState } from "../components/LoadingState";
import { riderApi } from "../services/riderApi";
import type { RiderSession } from "../types";
import { DeliveredSuccessPage } from "../pages/DeliveredSuccessPage";
import { DeliveriesPage } from "../pages/DeliveriesPage";
import { DeliveryDetailsPage } from "../pages/DeliveryDetailsPage";
import { LoginPage } from "../pages/LoginPage";

export function App() {
  const [session, setSession] = useState<RiderSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    riderApi
      .getSession()
      .then(setSession)
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) {
    return (
      <div className="app-shell">
        <main className="screen startup-screen">
          <p className="brand">ESANA</p>
          <LoadingState label="Preparing rider access" />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/login" element={<LoginPage session={session} onAuthenticated={setSession} />} />
        <Route
          path="/deliveries"
          element={
            <RequireSession session={session}>
              <DeliveriesPage session={session!} onLogout={() => setSession(null)} />
            </RequireSession>
          }
        />
        <Route
          path="/deliveries/:id"
          element={
            <RequireSession session={session}>
              <DeliveryDetailsPage />
            </RequireSession>
          }
        />
        <Route
          path="/delivered/:id"
          element={
            <RequireSession session={session}>
              <DeliveredSuccessPage />
            </RequireSession>
          }
        />
        <Route path="*" element={<Navigate to={session ? "/deliveries" : "/login"} replace />} />
      </Routes>
    </div>
  );
}

function RequireSession({ session, children }: { session: RiderSession | null; children: ReactNode }) {
  return session ? children : <Navigate to="/login" replace />;
}
