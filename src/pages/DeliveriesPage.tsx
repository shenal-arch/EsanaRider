import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { DeliveryCard } from "../components/DeliveryCard";
import { DeliveryTabs, type DeliveryTab } from "../components/DeliveryTabs";
import { LoadingState } from "../components/LoadingState";
import { riderApi } from "../services/riderApi";
import type { Delivery, RiderSession } from "../types";

interface DeliveriesPageProps {
  session: RiderSession;
  onLogout: () => void;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DeliveriesPage({ session, onLogout }: DeliveriesPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedTab = (location.state as { tab?: DeliveryTab } | null)?.tab;
  const [tab, setTab] = useState<DeliveryTab>(requestedTab ?? "active");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDeliveries(await riderApi.listDeliveries(tab));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Deliveries could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await riderApi.logout();
      onLogout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  const countLabel = `${deliveries.length} ${tab} ${deliveries.length === 1 ? "delivery" : "deliveries"}`;

  return (
    <main className="screen deliveries-screen">
      <header className="deliveries-header">
        <div>
          <h1>{getGreeting()}, {session.rider.name}</h1>
          <p>{loading ? "Checking deliveries…" : countLabel}</p>
        </div>
        <button className="text-button" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? "Leaving…" : "Logout"}
        </button>
      </header>

      <DeliveryTabs value={tab} onChange={setTab} />

      {loading ? <LoadingState /> : null}
      {!loading && error ? (
        <section className="message-state" role="alert">
          <h2>We could not load your deliveries</h2>
          <p>{error}</p>
          <Button size="medium" onClick={() => void loadDeliveries()}>Try again</Button>
        </section>
      ) : null}

      {!loading && !error && deliveries.length === 0 ? (
        <section className="empty-state">
          <img src="/assets/empty-state.svg" alt="" width="96" height="96" />
          <h2>{tab === "active" ? "You're all caught up" : "No completed deliveries yet"}</h2>
          <p>
            {tab === "active"
              ? "New dispatched orders assigned to you will appear here."
              : "Orders you deliver will appear in this list."}
          </p>
          <Button size="medium" onClick={() => void loadDeliveries()}>Refresh</Button>
        </section>
      ) : null}

      {!loading && !error && deliveries.length > 0 ? (
        <section className="delivery-list" aria-label={`${tab} deliveries`}>
          {deliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onOpen={(selected) => navigate(`/deliveries/${selected.id}`)}
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}
