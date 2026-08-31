import type { Delivery } from "../types";

export function RouteMap({ delivery }: { delivery: Delivery }) {
  const query = encodeURIComponent(
    `${delivery.addressLines.join(", ")} (${delivery.route.latitude},${delivery.route.longitude})`,
  );

  return (
    <a
      className="route-map card"
      href={`https://www.google.com/maps/search/?api=1&query=${query}`}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open route to ${delivery.addressLines.join(", ")} in Google Maps`}
    >
      <span className="route-map__header">
        <strong>Route to customer</strong>
        <span>{delivery.route.distanceKm.toFixed(1)} km · {delivery.route.etaMinutes} min</span>
      </span>
      <span className="route-map__canvas">
        <img src="/assets/route-preview.svg" alt="Route preview from restaurant to customer" />
      </span>
    </a>
  );
}
