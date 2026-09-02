import { useEffect, useRef } from "react";
import { Button } from "./Button";
import type { Delivery } from "../types";

interface ConfirmDeliveryDialogProps {
  delivery: Delivery;
  pending: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeliveryDialog({
  delivery,
  pending,
  error,
  onCancel,
  onConfirm,
}: ConfirmDeliveryDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel, pending]);

  return (
    <div className="dialog-layer" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target && !pending) onCancel();
    }}>
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delivery-title"
        aria-describedby="confirm-delivery-description"
      >
        <img className="confirm-dialog__icon" src="/assets/confirm-delivery.svg" alt="" />
        <h2 id="confirm-delivery-title">Confirm delivery</h2>
        <p>Mark order #{delivery.orderNumber} as delivered?</p>
        <p id="confirm-delivery-description" className="confirm-dialog__supporting">
          The restaurant view and customer notification will update immediately.
        </p>
        <ul>
          <li>This delivery can only be confirmed once.</li>
        </ul>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="confirm-dialog__actions">
          <Button size="small" onClick={onConfirm} disabled={pending}>
            {pending ? "Confirming…" : "Confirm delivery"}
          </Button>
          <Button
            ref={cancelRef}
            size="small"
            variant="secondary"
            onClick={onCancel}
            disabled={pending}
          >
            Go back
          </Button>
        </div>
      </section>
    </div>
  );
}
