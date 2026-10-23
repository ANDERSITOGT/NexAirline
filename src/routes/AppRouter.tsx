import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { BackendUnavailable } from "@/components/BackendUnavailable";
import Shell from "@/layouts/Shell";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { Login } from "@/pages/Login";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import FlightsPage from "@/pages/flights/FlightsPage";
import NewFlightPage from "@/pages/flights/NewFlightPage";
import FlightPricingMap from "@/pages/vuelos/FlightPricingMap";
import DispatchPage from "@/pages/operations/DispatchPage";
import ReassignmentsPage from "@/pages/reassignments/ReassignmentsPage";
import FleetPage from "@/pages/fleet/FleetPage";
import FleetHubPage from "@/pages/fleet/FleetHubPage";
import SeatMapPage from "@/pages/seats/SeatMapPage";
import CabinWizardPage from "@/pages/fleet/CabinWizardPage";
import InfrastructurePage from "@/pages/infrastructure/InfrastructurePage";
import InfrastructureHubPage from "@/pages/infrastructure/InfrastructureHubPage";
import ReservationsPage from "@/pages/reservations/ReservationsPage";
import PaymentsPage from "@/pages/payments/PaymentsPage";
import SalesHubPage from "@/pages/ventas/SalesHubPage";
import SecurityPage from "@/pages/security/SecurityPage";
import AuditPage from "@/pages/audit/AuditPage";
import OperationsHubPage from "@/pages/operaciones/OperationsHubPage";
import SecurityHubPage from "@/pages/seguridad/SecurityHubPage";
import { checkApiConnection, isApiConfigured } from "@/services/api";

type BackendStatus = "checking" | "available" | "unavailable";

function BackendStatusGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const checkConnection = useCallback(async () => {
    setStatus("checking");
    const connected = isApiConfigured && (await checkApiConnection());
    setStatus(connected ? "available" : "unavailable");
  }, []);

  useEffect(() => {
    void checkApiConnection().then((connected) => {
      setStatus(connected && isApiConfigured ? "available" : "unavailable");
    });
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center" aria-label="Cargando">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "unavailable") {
    return <BackendUnavailable isChecking={false} onRetry={() => void checkConnection()} />;
  }

  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <BackendStatusGate>
        <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Shell />}>
            <Route index element={<Navigate replace to="/operaciones/dashboard" />} />
            <Route path="home" element={<Navigate replace to="/operaciones/dashboard" />} />
            <Route path="operaciones" element={<OperationsHubPage />} />
            <Route path="operaciones/dashboard" element={<DashboardPage />} />
            <Route path="operaciones/vuelos" element={<FlightsPage />} />
            <Route path="operaciones/reasignaciones" element={<ReassignmentsPage />} />
            <Route path="dashboard" element={<Navigate replace to="/operaciones/dashboard" />} />
            <Route path="vuelos" element={<Navigate replace to="/operaciones/vuelos" />} />
            <Route path="vuelos/nuevo" element={<NewFlightPage />} />
            <Route path="vuelos/:vueloId/asientos" element={<FlightPricingMap />} />
            <Route path="vuelos/:vueloId/despacho" element={<DispatchPage />} />
            <Route path="reasignaciones" element={<Navigate replace to="/operaciones/reasignaciones" />} />
            <Route path="flota" element={<FleetHubPage />} />
            <Route path="flota/aviones" element={<FleetPage />} />
            <Route path="flota/mapa-asientos" element={<SeatMapPage />} />
            <Route path="flota/cabina/nueva/:avionId" element={<CabinWizardPage />} />
            <Route path="asientos" element={<Navigate replace to="/flota/mapa-asientos" />} />
            <Route path="infraestructura" element={<InfrastructureHubPage />} />
            <Route path="infraestructura/catalogos" element={<InfrastructurePage />} />
            <Route path="ventas" element={<SalesHubPage />} />
            <Route path="ventas/reservas" element={<ReservationsPage />} />
            <Route path="ventas/pagos" element={<PaymentsPage />} />
            <Route path="reservas" element={<Navigate replace to="/ventas/reservas" />} />
            <Route path="pagos" element={<Navigate replace to="/ventas/pagos" />} />
            <Route path="seguridad" element={<SecurityHubPage />} />
            <Route path="seguridad/roles" element={<SecurityPage />} />
            <Route path="seguridad/bitacora" element={<AuditPage />} />
            <Route path="roles" element={<Navigate replace to="/seguridad/roles" />} />
            <Route path="bitacora" element={<Navigate replace to="/seguridad/bitacora" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </BackendStatusGate>
    </BrowserRouter>
  );
}
