import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Shell from "@/components/Shell";
import Dashboard from "@/components/Dashboard";
import Fleet from "@/components/Fleet";
import Flights from "@/components/Flights";

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
          <Route path="vuelos/nuevo" element={page("Programar vuelo")} />
          <Route path="reasignaciones" element={page("Reasignaciones")} />
          <Route path="flota" element={<Fleet />} />
          <Route path="asientos" element={page("Mapa de asientos")} />
          <Route path="infraestructura" element={page("Catálogos base")} />
          <Route path="reservas" element={page("Reservas")} />
          <Route path="pagos" element={page("Pagos")} />
          <Route path="seguridad" element={page("Roles y errores")} />
          <Route path="bitacora" element={page("Bitácora de asientos")} />
          <Route path="modelo" element={page("Modelo de datos")} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
