import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { LoadingState } from "../components/LoadingState";
import { riderApi } from "../services/riderApi";
import type { Delivery } from "../types";

export function DeliveredSuccessPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateDelivery = (location.state as { delivery?: Delivery } | null)?.delivery;
  const [delivery, setDelivery] = useState<Delivery | null>(stateDelivery ?? null);
  const [loading, setLoading] = useState(!stateDelivery);
  const [toastVisible, setToastVisible] = useState(true);

  useEffect(() => {
    if (stateDelivery) return;
    riderApi
      .getDelivery(id)
      .then(setDelivery)
      .catch(() => setDelivery(null))
      .finally(() => setLoading(false));
  }, [id, stateDelivery]);

  if (loading) return <main className="screen success-screen"><LoadingState label="Loading completion" /></main>;
  if (!delivery) return <NavigateHome />;

  const deliveredTime = delivery.deliveredAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(delivery.deliveredAt))
    : "Just now";

  return (
    <main className="screen success-screen">
      {toastVisible ? (
        <aside className="success-toast" role="status">
          <img src="/assets/success-check.svg" alt="" width="18" height="18" />
          <div>
            <strong>Delivery confirmed</strong>
            <p>Order #{delivery.orderNumber} has been marked as delivered.</p>
            <div className="success-toast__actions">
              <button onClick={() => navigate(`/deliveries/${delivery.id}`)}>View</button>
              <button onClick={() => setToastVisible(false)}>Dismiss</button>
            </div>
          </div>
          <button className="icon-button" onClick={() => setToastVisible(false)} aria-label="Dismiss notification">
            <img src="/assets/close.svg" alt="" width="18" height="18" />
          </button>
        </aside>
      ) : null}

      <img className="success-screen__icon" src="/assets/delivered.svg" alt="" width="112" height="112" />
      <h1>Delivery completed</h1>
      <p className="success-screen__description">
        The order has moved to completed deliveries and the customer was notified.
      </p>
      <section className="card completion-summary">
        <strong>#{delivery.orderNumber} · {delivery.restaurant}</strong>
        <span>Delivered {deliveredTime}</span>
      </section>
      <Button onClick={() => navigate("/deliveries", { replace: true, state: { tab: "active" } })}>
        Back to active deliveries
      </Button>
    </main>
  );
}

function NavigateHome() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate("/deliveries", { replace: true });
  }, [navigate]);
  return null;
}
