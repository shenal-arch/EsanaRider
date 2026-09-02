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
      <p className="delivery-card__customer">
        <span>{delivery.customerName}</span>
        <span aria-hidden="true">·</span>
        <a href={`tel:${delivery.customerPhone.replace(/\s/g, "")}`}>{delivery.customerPhone}</a>
      </p>
      <Button
        className="delivery-card__view-button"
        variant="ghost"
        size="medium"
        onClick={() => onOpen(delivery)}
      >
        {completed ? "View details" : "View delivery"}
      </Button>
    </article>
  );
}
