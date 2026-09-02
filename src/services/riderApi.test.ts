import { demoPassword, demoRider } from "../data/demo";
import { LocalRiderApi } from "./riderApi";

describe("LocalRiderApi", () => {
  it("authenticates the active demo rider", async () => {
    const api = new LocalRiderApi();
    const session = await api.login({ identifier: demoRider.email, password: demoPassword, rememberMe: false });

    expect(session.rider.id).toBe(demoRider.id);
    expect(window.localStorage.getItem("esana-rider-session")).toBeNull();
    expect(window.sessionStorage.getItem("esana-rider-session")).not.toBeNull();
    await expect(api.listDeliveries("active")).resolves.toHaveLength(10);
  });

  it("rejects invalid credentials", async () => {
    const api = new LocalRiderApi();

    await expect(api.login({ identifier: demoRider.email, password: "incorrect", rememberMe: false })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("moves a dispatched order to completed deliveries exactly once", async () => {
    const api = new LocalRiderApi();
    await api.login({ identifier: demoRider.email, password: demoPassword, rememberMe: false });
    const [delivery] = await api.listDeliveries("active");

    const completed = await api.markDelivered(delivery.id);
    expect(completed.status).toBe("DELIVERED");
    expect(completed.deliveredAt).toBeTruthy();
    expect(await api.listDeliveries("active")).toHaveLength(9);
    expect((await api.listDeliveries("completed")).some((item) => item.id === delivery.id)).toBe(true);

    await expect(api.markDelivered(delivery.id)).rejects.toMatchObject({ code: "ALREADY_DELIVERED" });
  });

  it("remembers the rider and session when requested", async () => {
    const api = new LocalRiderApi();
    await api.login({ identifier: demoRider.email, password: demoPassword, rememberMe: true });

    expect(window.localStorage.getItem("esana-rider-session")).not.toBeNull();
    expect(window.localStorage.getItem("esana-rider-remembered-identifier")).toBe(demoRider.email);
    expect(window.sessionStorage.getItem("esana-rider-session")).toBeNull();
  });

  it("requests a reset link and accepts the new password once", async () => {
    const api = new LocalRiderApi();
    const request = await api.requestPasswordReset(demoRider.email);

    expect(request.resetToken).toBeTruthy();
    await api.resetPassword({ token: request.resetToken!, newPassword: "NewRider123!" });
    await expect(
      api.login({ identifier: demoRider.email, password: demoPassword, rememberMe: false }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    await expect(
      api.login({ identifier: demoRider.email, password: "NewRider123!", rememberMe: false }),
    ).resolves.toMatchObject({ rider: { id: demoRider.id } });
    await expect(
      api.resetPassword({ token: request.resetToken!, newPassword: "AnotherPassword!" }),
    ).rejects.toMatchObject({ code: "INVALID_RESET_TOKEN" });
  });
});
