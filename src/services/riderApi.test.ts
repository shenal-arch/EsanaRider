import { demoPassword, demoRider } from "../data/demo";
import { LocalRiderApi } from "./riderApi";

describe("LocalRiderApi", () => {
  it("authenticates the active demo rider", async () => {
    const api = new LocalRiderApi();
    const session = await api.login({ identifier: demoRider.email, password: demoPassword });

    expect(session.rider.id).toBe(demoRider.id);
    await expect(api.listDeliveries("active")).resolves.toHaveLength(2);
  });

  it("rejects invalid credentials", async () => {
    const api = new LocalRiderApi();

    await expect(api.login({ identifier: demoRider.email, password: "incorrect" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("moves a dispatched order to completed deliveries exactly once", async () => {
    const api = new LocalRiderApi();
    await api.login({ identifier: demoRider.email, password: demoPassword });
    const [delivery] = await api.listDeliveries("active");

    const completed = await api.markDelivered(delivery.id);
    expect(completed.status).toBe("DELIVERED");
    expect(completed.deliveredAt).toBeTruthy();
    expect(await api.listDeliveries("active")).toHaveLength(1);
    expect((await api.listDeliveries("completed")).some((item) => item.id === delivery.id)).toBe(true);

    await expect(api.markDelivered(delivery.id)).rejects.toMatchObject({ code: "ALREADY_DELIVERED" });
  });
});
