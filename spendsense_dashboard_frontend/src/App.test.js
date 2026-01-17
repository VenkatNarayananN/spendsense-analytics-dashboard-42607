import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

test("renders sign-in screen when unauthenticated", () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  // With auth gating, the default unauthenticated view is the Login page.
  expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
});
