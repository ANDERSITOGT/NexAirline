import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Shell from "@/layouts/Shell";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { Login } from "@/pages/Login";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import FlightsPage from "@/pages/flights/FlightsPage";
import NewFlightPage from "@/pages/flights/NewFlightPage";
import ReassignmentsPage from "@/pages/reassignments/ReassignmentsPage";
import FleetPage from "@/pages/fleet/FleetPage";
import SeatMapPage from "@/pages/seats/SeatMapPage";
import InfrastructurePage from "@/pages/infrastructure/InfrastructurePage";
import ReservationsPage from "@/pages/reservations/ReservationsPage";
import PaymentsPage from "@/pages/payments/PaymentsPage";
import SecurityPage from "@/pages/security/SecurityPage";
import AuditPage from "@/pages/audit/AuditPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Shell />}>
            <Route index element={<Navigate replace to="/dashboard" />} />
            <Route path="home" element={<Navigate replace to="/dashboard" />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="vuelos" element={<FlightsPage />} />
            <Route path="vuelos/nuevo" element={<NewFlightPage />} />
            <Route path="reasignaciones" element={<ReassignmentsPage />} />
            <Route path="flota" element={<FleetPage />} />
            <Route path="asientos" element={<SeatMapPage />} />
            <Route path="infraestructura" element={<InfrastructurePage />} />
            <Route path="reservas" element={<ReservationsPage />} />
            <Route path="pagos" element={<PaymentsPage />} />
            <Route path="seguridad" element={<SecurityPage />} />
            <Route path="bitacora" element={<AuditPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
