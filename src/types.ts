export type DeliveryStatus = "DISPATCHED" | "DELIVERED" | "COMPLETED";
export type PaymentStatus = "PAID" | "CASH ON DELIVERY";

export interface Rider {
  id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface RiderSession {
  token: string;
  rider: Rider;
}

export interface Delivery {
  id: string;
  orderNumber: string;
  restaurant: string;
  branch: string;
  customerName: string;
  customerPhone: string;
  addressLines: string[];
  instructions: string;
  paymentStatus: PaymentStatus;
  status: DeliveryStatus;
  assignedRiderId: string;
  dispatchedAt: string;
  deliveredAt?: string;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
  rememberMe: boolean;
}

export interface PasswordResetRequestResult {
  message: string;
  resetToken?: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export class RiderApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "RiderApiError";
  }
}
