import type { DeliveryStatus } from "../types";

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  return <span className={`status-badge status-badge--${status.toLowerCase()}`}>{status}</span>;
}
