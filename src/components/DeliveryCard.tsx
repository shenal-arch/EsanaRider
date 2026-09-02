import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";
import type { Delivery } from "../types";

interface DeliveryCardProps {
  delivery: Delivery;
  onOpen: (delivery: Delivery) => void;
}

export function DeliveryCard({ delivery, onOpen }: DeliveryCardProps) {
  const completed = delivery.status !== "DISPATCHED";
  const address = delivery.addressLines.join(", ");
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  return (
    <article className="delivery-card" aria-labelledby={`${delivery.id}-title`}>
      <div className="delivery-card__header">
        <h2 id={`${delivery.id}-title`}>#{delivery.orderNumber}</h2>
        {completed ? <StatusBadge status={delivery.status} /> : null}
      </div>
      <div className="delivery-card__destination">
        <span>Delivery address</span>
        <p>{address}</p>
      </div>
      <a className="delivery-card__phone" href={`tel:${delivery.customerPhone.replace(/\s/g, "")}`}>
        {delivery.customerPhone}
      </a>
      <div className="delivery-card__actions">
        <Button
          className="delivery-card__view-button"
          variant="ghost"
          size="medium"
          onClick={() => onOpen(delivery)}
        >
          {completed ? "View details" : "View delivery"}
        </Button>
        {!completed ? (
          <a
            className="button button--primary button--large button--full delivery-card__start-button"
            href={navigationUrl}
            target="_blank"
            rel="noreferrer"
          >
            Start Ride
          </a>
        ) : null}
      </div>
    </article>
  );
}
