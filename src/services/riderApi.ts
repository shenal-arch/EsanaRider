import { demoDeliveries, demoPassword, demoRider } from "../data/demo";
import {
  RiderApiError,
  type Delivery,
  type DeliveryStatus,
  type LoginCredentials,
  type RiderSession,
} from "../types";

export interface RiderApi {
  getSession(): Promise<RiderSession | null>;
  login(credentials: LoginCredentials): Promise<RiderSession>;
  logout(): Promise<void>;
  listDeliveries(status: "active" | "completed"): Promise<Delivery[]>;
  getDelivery(id: string): Promise<Delivery>;
  markDelivered(id: string): Promise<Delivery>;
  resetDemoData?(): Promise<void>;
}

const storageKeys = {
  session: "esana-rider-session",
  deliveries: "esana-rider-deliveries",
} as const;

const wait = (milliseconds = 180) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const cloneDeliveries = () => structuredClone(demoDeliveries);

export class LocalRiderApi implements RiderApi {
  private readSession(): RiderSession | null {
    const value = window.localStorage.getItem(storageKeys.session);
    if (!value) return null;
    try {
      return JSON.parse(value) as RiderSession;
    } catch {
      window.localStorage.removeItem(storageKeys.session);
      return null;
    }
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

  async login({ identifier, password }: LoginCredentials) {
    await wait();
    const normalized = identifier.trim().toLowerCase();
    const recognized = normalized === demoRider.email || normalized === demoRider.phone.toLowerCase();

    if (!recognized || password !== demoPassword || !demoRider.active) {
      throw new RiderApiError("The email, mobile number, or password is incorrect.", "INVALID_CREDENTIALS", 401);
    }

    const session: RiderSession = {
      token: `demo-${crypto.randomUUID()}`,
      rider: structuredClone(demoRider),
    };
    window.localStorage.setItem(storageKeys.session, JSON.stringify(session));
    this.readDeliveries();
    return session;
  }

  async logout() {
    await wait(80);
    window.localStorage.removeItem(storageKeys.session);
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
    return updated;
  }

  async resetDemoData() {
    this.writeDeliveries(cloneDeliveries());
    await wait(80);
  }
}

class HttpRiderApi implements RiderApi {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const session = window.localStorage.getItem(storageKeys.session);
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
    const value = window.localStorage.getItem(storageKeys.session);
    return value ? (JSON.parse(value) as RiderSession) : null;
  }

  async login(credentials: LoginCredentials) {
    const session = await this.request<RiderSession>("/auth/rider/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    window.localStorage.setItem(storageKeys.session, JSON.stringify(session));
    return session;
  }

  async logout() {
    try {
      await this.request<void>("/auth/logout", { method: "POST" });
    } finally {
      window.localStorage.removeItem(storageKeys.session);
    }
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

export const isCompletedStatus = (status: DeliveryStatus) =>
  status === "DELIVERED" || status === "COMPLETED";
