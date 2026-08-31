import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { demoPassword, demoRider } from "../data/demo";
import { App } from "./App";

describe("rider delivery journey", () => {
  it("signs in, opens a delivery, and confirms it", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>,
    );

    await user.type(await screen.findByLabelText("Email or mobile number"), demoRider.email);
    await user.type(screen.getByLabelText("Password"), demoPassword);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("#ES-10482")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "View delivery" })[0]);

    expect(await screen.findByRole("heading", { name: "Delivery details" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark as delivered" }));
    expect(screen.getByRole("dialog", { name: "Confirm delivery" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm delivery" }));

    expect(await screen.findByRole("heading", { name: "Delivery completed" })).toBeInTheDocument();
    expect(screen.getByText(/has been marked as delivered/)).toBeInTheDocument();
  });
});
