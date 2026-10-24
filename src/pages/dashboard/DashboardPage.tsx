import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { ArrowUpRight, PlaneTakeoff, Ticket, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { flights, planeById, planes, routeLabel, type Flight } from "@/data1";
import { reservas } from "@/data2";
import { mantenimientos } from "@/data3";
import { usePreferences } from "@/contexts/usePreferences";
import { formatDateTime, formatTime } from "@/utils/dateUtils";

function Kpi({ label, value, delta, icon: Icon, tone }: { label: string; value: string; delta: string; icon: typeof Ticket; tone: string }) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className={`flex size-8 items-center justify-center rounded-md ${tone}`}>
            <Icon className="size-4" />
          </span>
        </div>
        <div className="mt-3 font-mono text-4xl font-medium tracking-tight">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{delta}</div>
      </CardContent>
    </Card>
  );
}

function FlightBadge({ value }: { value: string }) {
  const variant = value === "CANCELADO" ? "destructive" : value === "FINALIZADO" ? "secondary" : "default";
  return <Badge variant={variant}>{value}</Badge>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { timezone } = usePreferences();
  const flightList: Flight[] = flights;
  const dashboardDate = "2026-10-15";
  const active = flightList.filter((flight) => flight.estado === "EN_VUELO" || flight.estado === "ABORDANDO").length;
  const maint = mantenimientos.filter((maintenance) => maintenance.estado !== "COMPLETADO").length;
  const reservationsToday = reservas.filter((reservation) => reservation.creada.startsWith(dashboardDate));
  const passengersToday = reservationsToday.reduce((total, reservation) => total + reservation.pax.length, 0);
  const upcoming = useMemo(() => flightList
    .filter((flight) => (flight.estado === "PROGRAMADO" || flight.estado === "ABORDANDO") && flight.salida.startsWith(dashboardDate))
    .sort((a, b) => a.salida.localeCompare(b.salida))
    .slice(0, 6), [flightList]);

  return (
    <div>
      <AppBreadcrumb
        items={[{ label: "Operaciones", href: "/operaciones" }, { label: "Dashboard" }]}
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{formatDateTime("2026-10-15T13:42", timezone)} · {timezone}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Operaciones de hoy</h1>
        </div>
        <Button onClick={() => navigate("/vuelos/nuevo")}><PlaneTakeoff className="size-4" /> Programar vuelo</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi label="Vuelos activos" value={String(active)} delta={`${flightList.filter((flight) => flight.estado === "ABORDANDO").length} abordando · ${flightList.filter((flight) => flight.estado === "EN_VUELO").length} en ruta`} icon={PlaneTakeoff} tone="bg-ok-bg text-ok" />
        <Kpi label="Pasajeros de hoy" value={passengersToday.toLocaleString("es-GT")} delta={`${reservationsToday.length} reservas creadas hoy`} icon={Ticket} tone="bg-info-bg text-info" />
        <Kpi label="Aeronaves en mantenimiento" value={String(maint)} delta={`de ${planes.length} en flota · ${mantenimientos.filter((maintenance) => maintenance.fin === dashboardDate).length} finaliza hoy`} icon={Wrench} tone="bg-warn-bg text-warn" />
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><h2 className="font-semibold">Próximas salidas</h2><p className="text-sm text-muted-foreground">Ordenadas por hora de salida</p></div>
          <Button variant="ghost" onClick={() => navigate("/vuelos")}>Ver todos <ArrowUpRight className="size-4" /></Button>
        </header>

        <Table className="hidden md:table">
          <TableHeader><TableRow className="text-left text-xs uppercase tracking-wide text-muted-foreground">{["Vuelo", "Ruta", "Aeronave", "Salida", "Puerta", "Estado"].map((heading) => <TableHead key={heading} className="px-5 py-3 font-semibold">{heading}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{upcoming.map((flight) => <TableRow key={flight.id} className="hover:bg-background"><TableCell className="px-5 py-3 font-mono font-medium">{flight.numero}</TableCell><TableCell className="px-5 py-3 font-mono">{routeLabel(flight.ruta)}</TableCell><TableCell className="px-5 py-3 text-muted-foreground">{planeById(flight.avion).matricula}</TableCell><TableCell className="px-5 py-3 font-mono">{formatTime(flight.salida, timezone)}</TableCell><TableCell className="px-5 py-3 font-mono">{flight.puerta ?? <span className="text-muted-foreground">—</span>}</TableCell><TableCell className="px-5 py-3"><FlightBadge value={flight.estado} /></TableCell></TableRow>)}</TableBody>
        </Table>

        <ul className="divide-y divide-border md:hidden">{upcoming.map((flight) => <li key={flight.id} className="flex items-center justify-between gap-3 px-4 py-3"><div><div className="font-mono text-sm font-medium">{flight.numero} · {routeLabel(flight.ruta)}</div><div className="mt-0.5 text-xs text-muted-foreground">{formatTime(flight.salida, timezone)} · Puerta {flight.puerta ?? "—"} · {planeById(flight.avion).matricula}</div></div><FlightBadge value={flight.estado} /></li>)}</ul>
        {upcoming.length === 0 && <div className="px-5 py-10 text-center text-sm text-muted-foreground">No hay salidas programadas para hoy.</div>}
      </section>
    </div>
  );
}
