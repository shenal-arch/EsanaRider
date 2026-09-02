import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { ConfirmDeliveryDialog } from "../components/ConfirmDeliveryDialog";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { isCompletedStatus, riderApi } from "../services/riderApi";
import type { Delivery } from "../types";

export function DeliveryDetailsPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationError, setConfirmationError] = useState("");

  const loadDelivery = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDelivery(await riderApi.getDelivery(id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The delivery could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDelivery();
  }, [loadDelivery]);

  async function markDelivered() {
    if (!delivery) return;
    setSubmitting(true);
    setConfirmationError("");
    try {
      const completed = await riderApi.markDelivered(delivery.id);
      setDelivery(completed);
      setConfirming(false);
      navigate(`/delivered/${completed.id}`, { replace: true, state: { delivery: completed } });
    } catch (caught) {
      setConfirmationError(caught instanceof Error ? caught.message : "Delivery could not be confirmed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="screen details-screen"><LoadingState label="Loading delivery details" /></main>;
  }

  if (!delivery || error) {
    return (
      <main className="screen details-screen">
        <TopBar onBack={() => navigate("/deliveries")} />
        <section className="message-state" role="alert">
          <h2>Delivery unavailable</h2>
          <p>{error || "This delivery is no longer available."}</p>
          <Button size="medium" onClick={() => navigate("/deliveries")}>Back to deliveries</Button>
        </section>
      </main>
    );
  }

  const completed = isCompletedStatus(delivery.status);

  return (
    <main className="screen details-screen">
      <TopBar onBack={() => navigate("/deliveries", { state: { tab: completed ? "completed" : "active" } })} />

      <section className="card order-summary">
        <div className="order-summary__header">
          <h2>#{delivery.orderNumber}</h2>
          {completed ? <StatusBadge status={delivery.status} /> : null}
        </div>
        <p className="strong">{delivery.restaurant}</p>
      </section>

      <section className="card delivery-information">
        <h2>Customer &amp; drop-off</h2>
        <Detail label="Customer">
          {delivery.customerName} · <a href={`tel:${delivery.customerPhone.replace(/\s/g, "")}`}>{delivery.customerPhone}</a>
        </Detail>
        <Detail label="Delivery address">
          {delivery.addressLines.map((line) => <span key={line}>{line}</span>)}
        </Detail>
        <Detail label="Delivery instructions">{delivery.instructions}</Detail>
      </section>

      <section className="payment-status card">
        <span>Payment status</span>
        <strong>{delivery.paymentStatus}</strong>
      </section>

      {!completed ? (
        <>
          <Button onClick={() => setConfirming(true)}>Mark as delivered</Button>
          <p className="action-note">Only the assigned rider can complete this delivery.</p>
        </>
      ) : (
        <section className="completion-note" aria-label="Delivery completion">
          <strong>Delivery confirmed</strong>
          <span>{delivery.deliveredAt ? formatDeliveredTime(delivery.deliveredAt) : "Completed"}</span>
        </section>
      )}

      {confirming ? (
        <ConfirmDeliveryDialog
          delivery={delivery}
          pending={submitting}
          error={confirmationError}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void markDelivered()}
        />
      ) : null}
    </main>
  );
}

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <header className="top-bar">
      <button className="icon-button" onClick={onBack} aria-label="Back to deliveries">
        <img src="/assets/back.svg" alt="" width="24" height="24" />
      </button>
      <h1>Delivery details</h1>
    </header>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <div className="detail-row__value">{children}</div>
    </div>
  );
}

function formatDeliveredTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
