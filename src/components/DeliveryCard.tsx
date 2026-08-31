import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";
import type { Delivery } from "../types";

interface DeliveryCardProps {
  delivery: Delivery;
  onOpen: (delivery: Delivery) => void;
}

export function DeliveryCard({ delivery, onOpen }: DeliveryCardProps) {
  const completed = delivery.status !== "DISPATCHED";

  return (
    <article className="delivery-card" aria-labelledby={`${delivery.id}-title`}>
      <div className="delivery-card__header">
        <h2 id={`${delivery.id}-title`}>#{delivery.orderNumber}</h2>
        <StatusBadge status={delivery.status} />
      </div>
      <p className="delivery-card__restaurant">
        {delivery.restaurant} · {delivery.branch}
      </p>
      <p>{delivery.customerName} · {delivery.customerPhone}</p>
      <p>{delivery.addressLines.join(", ")}</p>
      <Button size="medium" onClick={() => onOpen(delivery)}>
        {completed ? "View details" : "View delivery"}
      </Button>
    </article>
  );
}
