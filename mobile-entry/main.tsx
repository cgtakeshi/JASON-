import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import PortfolioAdmin from "../components/PortfolioAdmin";
import "../app/globals.css";

const isAdminRoute = window.location.pathname === "/admin" || window.location.pathname.startsWith("/admin/");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isAdminRoute ? <PortfolioAdmin /> : <Home />}
  </StrictMode>,
);
