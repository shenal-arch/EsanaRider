import { demoDeliveries, demoPassword, demoRider } from "../data/demo";
import {
  RiderApiError,
  type Delivery,
  type DeliveryStatus,
  type LoginCredentials,
  type PasswordResetRequestResult,
  type ResetPasswordInput,
  type RiderSession,
} from "../types";

export interface RiderApi {
  getSession(): Promise<RiderSession | null>;
  login(credentials: LoginCredentials): Promise<RiderSession>;
  logout(): Promise<void>;
  requestPasswordReset(email: string): Promise<PasswordResetRequestResult>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
  listDeliveries(status: "active" | "completed"): Promise<Delivery[]>;
  getDelivery(id: string): Promise<Delivery>;
  markDelivered(id: string): Promise<Delivery>;
  resetDemoData?(): Promise<void>;
}

const storageKeys = {
  session: "esana-rider-session",
  deliveries: "esana-rider-deliveries-v3",
  rememberedIdentifier: "esana-rider-remembered-identifier",
  demoPassword: "esana-rider-demo-password",
  passwordReset: "esana-rider-password-reset",
  rideInProgress: "esana-rider-ride-in-progress",
} as const;

const wait = (milliseconds = 180) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const cloneDeliveries = () => structuredClone(demoDeliveries);

export class LocalRiderApi implements RiderApi {
  private readSession(): RiderSession | null {
    const value =
      window.localStorage.getItem(storageKeys.session) ??
      window.sessionStorage.getItem(storageKeys.session);
    if (!value) return null;
    try {
      return JSON.parse(value) as RiderSession;
    } catch {
      window.localStorage.removeItem(storageKeys.session);
      window.sessionStorage.removeItem(storageKeys.session);
      return null;
    }
  }

  private writeSession(session: RiderSession, rememberMe: boolean) {
    window.localStorage.removeItem(storageKeys.session);
    window.sessionStorage.removeItem(storageKeys.session);
    const storage = rememberMe ? window.localStorage : window.sessionStorage;
    storage.setItem(storageKeys.session, JSON.stringify(session));
  }

  private readDeliveries(): Delivery[] {
    const value = window.localStorage.getItem(storageKeys.deliveries);
    if (!value) {
      const deliveries = cloneDeliveries();
      this.writeDeliveries(deliveries);
      return deliveries;
    }

    try {
      return JSON.parse(value) as Delivery[];
    } catch {
      const deliveries = cloneDeliveries();
      this.writeDeliveries(deliveries);
      return deliveries;
    }
  }

  private writeDeliveries(deliveries: Delivery[]) {
    window.localStorage.setItem(storageKeys.deliveries, JSON.stringify(deliveries));
  }

  private requireSession(): RiderSession {
    const session = this.readSession();
    if (!session || !session.rider.active) {
      throw new RiderApiError("Your rider session has expired. Please sign in again.", "UNAUTHENTICATED", 401);
    }
    return session;
  }

  async getSession() {
    await wait(40);
    return this.readSession();
  }

  async login({ identifier, password, rememberMe }: LoginCredentials) {
    await wait();
    const normalized = identifier.trim().toLowerCase();
    const recognized = normalized === demoRider.email || normalized === demoRider.phone.toLowerCase();

    const currentPassword = window.localStorage.getItem(storageKeys.demoPassword) ?? demoPassword;
    if (!recognized || password !== currentPassword || !demoRider.active) {
      throw new RiderApiError("The email, mobile number, or password is incorrect.", "INVALID_CREDENTIALS", 401);
    }

    const session: RiderSession = {
      token: `demo-${crypto.randomUUID()}`,
      rider: structuredClone(demoRider),
    };
    this.writeSession(session, rememberMe);
    if (rememberMe) {
      window.localStorage.setItem(storageKeys.rememberedIdentifier, identifier.trim());
    } else {
      window.localStorage.removeItem(storageKeys.rememberedIdentifier);
    }
    this.readDeliveries();
    return session;
  }

  async logout() {
    await wait(80);
    window.localStorage.removeItem(storageKeys.session);
    window.sessionStorage.removeItem(storageKeys.session);
    this.writeDeliveries(cloneDeliveries());
    setStoredRideInProgress(false);
  }

  async requestPasswordReset(email: string) {
    await wait(220);
    const normalized = email.trim().toLowerCase();
    const result: PasswordResetRequestResult = {
      message: "If an active rider account matches that email, a password reset link has been sent.",
    };

    if (normalized === demoRider.email && demoRider.active) {
      const token = crypto.randomUUID();
      window.localStorage.setItem(
        storageKeys.passwordReset,
        JSON.stringify({ token, email: normalized, expiresAt: Date.now() + 30 * 60 * 1000 }),
      );
      result.resetToken = token;
    }
    return result;
  }

  async resetPassword({ token, newPassword }: ResetPasswordInput) {
    await wait(240);
    const value = window.localStorage.getItem(storageKeys.passwordReset);
    let request: { token: string; email: string; expiresAt: number } | null = null;
    try {
      request = value ? JSON.parse(value) : null;
    } catch {
      window.localStorage.removeItem(storageKeys.passwordReset);
    }
    if (!request || request.token !== token || request.expiresAt < Date.now()) {
      throw new RiderApiError("This password reset link is invalid or has expired.", "INVALID_RESET_TOKEN", 400);
    }
    if (newPassword.length < 8) {
      throw new RiderApiError("Your password must contain at least 8 characters.", "WEAK_PASSWORD", 400);
    }
    window.localStorage.setItem(storageKeys.demoPassword, newPassword);
    window.localStorage.removeItem(storageKeys.passwordReset);
    window.localStorage.removeItem(storageKeys.session);
    window.sessionStorage.removeItem(storageKeys.session);
  }

  async listDeliveries(status: "active" | "completed") {
    await wait();
    const session = this.requireSession();
    return this.readDeliveries().filter((delivery) => {
      if (delivery.assignedRiderId !== session.rider.id) return false;
      return status === "active"
        ? delivery.status === "DISPATCHED"
        : delivery.status === "DELIVERED" || delivery.status === "COMPLETED";
    });
  }

  async getDelivery(id: string) {
    await wait(100);
    const session = this.requireSession();
    const delivery = this.readDeliveries().find((item) => item.id === id);
    if (!delivery || delivery.assignedRiderId !== session.rider.id) {
      throw new RiderApiError("This delivery is not assigned to your account.", "NOT_FOUND", 404);
    }
    return delivery;
  }

  async markDelivered(id: string) {
    await wait(280);
    const session = this.requireSession();
    const deliveries = this.readDeliveries();
    const index = deliveries.findIndex((delivery) => delivery.id === id);
    const delivery = deliveries[index];

    if (!delivery || delivery.assignedRiderId !== session.rider.id) {
      throw new RiderApiError("This delivery is not assigned to your account.", "NOT_ASSIGNED", 403);
    }
    if (delivery.status !== "DISPATCHED") {
      throw new RiderApiError("This delivery has already been confirmed.", "ALREADY_DELIVERED", 409);
    }

    const updated: Delivery = {
      ...delivery,
      status: "DELIVERED",
      deliveredAt: new Date().toISOString(),
    };
    deliveries[index] = updated;
    this.writeDeliveries(deliveries);
    const hasActiveDeliveries = deliveries.some(
      (item) => item.assignedRiderId === session.rider.id && item.status === "DISPATCHED",
    );
    if (!hasActiveDeliveries) {
      setStoredRideInProgress(false);
    }
    return updated;
  }

  async resetDemoData() {
    this.writeDeliveries(cloneDeliveries());
    setStoredRideInProgress(false);
    await wait(80);
  }
}

class HttpRiderApi implements RiderApi {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const session =
      window.localStorage.getItem(storageKeys.session) ??
      window.sessionStorage.getItem(storageKeys.session);
    const token = session ? (JSON.parse(session) as RiderSession).token : null;
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
      throw new RiderApiError(body?.message ?? "The request could not be completed.", body?.code ?? "API_ERROR", response.status);
    }
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async getSession() {
    const value =
      window.localStorage.getItem(storageKeys.session) ??
      window.sessionStorage.getItem(storageKeys.session);
    return value ? (JSON.parse(value) as RiderSession) : null;
  }

  async login(credentials: LoginCredentials) {
    const session = await this.request<RiderSession>("/auth/rider/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    window.localStorage.removeItem(storageKeys.session);
    window.sessionStorage.removeItem(storageKeys.session);
    const storage = credentials.rememberMe ? window.localStorage : window.sessionStorage;
    storage.setItem(storageKeys.session, JSON.stringify(session));
    if (credentials.rememberMe) {
      window.localStorage.setItem(storageKeys.rememberedIdentifier, credentials.identifier.trim());
    } else {
      window.localStorage.removeItem(storageKeys.rememberedIdentifier);
    }
    return session;
  }

  async logout() {
    try {
      await this.request<void>("/auth/logout", { method: "POST" });
    } finally {
      window.localStorage.removeItem(storageKeys.session);
      window.sessionStorage.removeItem(storageKeys.session);
    }
  }

  requestPasswordReset(email: string) {
    return this.request<PasswordResetRequestResult>("/auth/rider/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  resetPassword(input: ResetPasswordInput) {
    return this.request<void>("/auth/rider/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  listDeliveries(status: "active" | "completed") {
    return this.request<Delivery[]>(`/rider/deliveries?status=${status}`);
  }

  getDelivery(id: string) {
    return this.request<Delivery>(`/rider/deliveries/${encodeURIComponent(id)}`);
  }

  markDelivered(id: string) {
    return this.request<Delivery>(`/rider/deliveries/${encodeURIComponent(id)}/deliver`, { method: "POST" });
  }
}

const useMockApi = import.meta.env.VITE_USE_MOCK_API !== "false";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export const riderApi: RiderApi =
  useMockApi || !apiBaseUrl ? new LocalRiderApi() : new HttpRiderApi(apiBaseUrl);

export const getRememberedIdentifier = () =>
  window.localStorage.getItem(storageKeys.rememberedIdentifier) ?? "";

export const getStoredRideInProgress = () =>
  window.localStorage.getItem(storageKeys.rideInProgress) === "true";

export const setStoredRideInProgress = (inProgress: boolean) => {
  if (inProgress) {
    window.localStorage.setItem(storageKeys.rideInProgress, "true");
  } else {
    window.localStorage.removeItem(storageKeys.rideInProgress);
  }
};

export const isCompletedStatus = (status: DeliveryStatus) =>
  status === "DELIVERED" || status === "COMPLETED";
