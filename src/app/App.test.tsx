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
    expect(screen.queryByText("DISPATCHED")).not.toBeInTheDocument();
    expect(screen.queryByText(/ESANA Kitchen ·/)).not.toBeInTheDocument();
    expect(screen.getByText("12 Galle Road, Colombo 03, Sri Lanka")).toBeInTheDocument();
    expect(screen.getByText("Maya Fernando")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+65 9123 4567" })).toHaveAttribute("href", "tel:+6591234567");
    await user.click(screen.getByRole("button", { name: "Start Ride" }));
    expect(screen.getByRole("button", { name: "On route" })).toHaveClass("ride-dock__button--on-route");
    await user.click(screen.getAllByRole("button", { name: "View delivery" })[0]);

    expect(await screen.findByRole("heading", { name: "Delivery details" })).toBeInTheDocument();
    expect(screen.queryByText("DISPATCHED")).not.toBeInTheDocument();
    expect(screen.queryByText("Orchard branch")).not.toBeInTheDocument();
    expect(screen.getByText("ESANA Kitchen")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark as delivered" }));
    expect(screen.getByRole("dialog", { name: "Confirm delivery" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm delivery" }));

    expect(await screen.findByRole("heading", { name: "Delivery completed" })).toBeInTheDocument();
    expect(screen.getByText(/has been marked as delivered/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to active deliveries" }));
    expect(await screen.findByRole("button", { name: "On route" })).toHaveClass("ride-dock__button--on-route");
  });

  it("resets the password from the login page and signs in with the new password", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("link", { name: "Forgot password?" }));
    await user.type(screen.getByLabelText("Email address"), demoRider.email);
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open demo reset link" }));
    await user.type(screen.getByLabelText("New password"), "NewRider123!");
    await user.type(screen.getByLabelText("Confirm password"), "NewRider123!");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByRole("heading", { name: "Password updated" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to sign in" }));
    await user.type(screen.getByLabelText("Email or mobile number"), demoRider.email);
    await user.type(screen.getByLabelText("Password"), "NewRider123!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("#ES-10482")).toBeInTheDocument();
  });
});
