import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Shell from "@/components/Shell";
import Dashboard from "@/components/Dashboard";
import Fleet from "@/components/Fleet";
import Flights from "@/components/Flights";
import Wizard from "@/components/Wizard";
import Reassignments from "@/components/Reassignments";
import SeatMap from "@/components/SeatMap";
import Infrastructure from "@/components/Infrastructure";
import Reservations from "@/components/Reservations";
import Payments from "@/components/Payments";

const page = (title: string) => (
  <div className="p-4 text-2xl font-bold">{title}</div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="vuelos" element={<Flights />} />
          <Route path="vuelos/nuevo" element={<Wizard />} />
          <Route path="reasignaciones" element={<Reassignments />} />
          <Route path="flota" element={<Fleet />} />
          <Route path="asientos" element={<SeatMap />} />
          <Route path="infraestructura" element={<Infrastructure />} />
          <Route path="reservas" element={<Reservations />} />
          <Route path="pagos" element={<Payments />} />
          <Route path="seguridad" element={page("Roles y errores")} />
          <Route path="bitacora" element={page("Bitácora de asientos")} />
          <Route path="modelo" element={page("Modelo de datos")} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
