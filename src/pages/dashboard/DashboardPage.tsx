import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { ArrowUpRight, DollarSign, Plane, PlaneTakeoff, Users, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboardSummary, type DashboardFlight, type DashboardSummary } from "@/services/dashboardService";
import { usePreferences } from "@/contexts/usePreferences";
import { formatDateTime, formatTime } from "@/utils/dateUtils";

const EMPTY_SUMMARY: DashboardSummary = {
  vuelos_activos: 0,
  vuelos_abordando: 0,
  vuelos_en_ruta: 0,
  pasajeros_hoy: 0,
  reservas_hoy: 0,
  aviones_mantenimiento: 0,
  total_aviones: 0,
  mantenimiento_alertas: 0,
  recaudacion_aprobada: 0,
  proximas_salidas: [],
};

function Kpi({
  label,
  value,
  context,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  context: string;
  icon: LucideIcon;
  href: string;
}) {
  return (
    <Link to={href} className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <Card className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-card">
        <CardContent className="p-0">
          <div className="flex items-center justify-between pb-2">
            <span className="text-sm font-medium tracking-tight text-slate-500">{label}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white shadow-sm">
              <Icon className="size-4" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-2 block min-h-9 text-3xl font-bold leading-none tracking-tight !text-slate-900 tabular-nums">
            {value || "0"}
          </div>
          <p className="mt-1 text-xs text-slate-500">{context}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function FlightBadge({ value }: { value: DashboardFlight["estado"] }) {
  const styles = {
    ABORDANDO: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
    EN_VUELO: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300",
    PROGRAMADO: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
    FINALIZADO: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300",
    CANCELADO: "bg-red-100 text-red-800 border-red-300",
  } satisfies Record<DashboardFlight["estado"], string>;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[value]}`}>
      {value === "ABORDANDO" && <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />}
      {value}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { timezone } = usePreferences();
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getDashboardSummary()
      .then((response) => {
        if (active) setSummary(response);
      })
      .catch((cause: unknown) => {
        console.error("Error al cargar dashboard:", cause);
        if (active) setError(cause instanceof Error ? cause.message : "No se pudo cargar el resumen del dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const upcoming = useMemo(
    () => [...(summary.proximas_salidas ?? [])]
      .filter((flight) => flight && typeof flight === "object")
      .sort((a, b) => (a.fecha_salida ?? "").localeCompare(b.fecha_salida ?? ""))
      .slice(0, 6),
    [summary.proximas_salidas],
  );
  const money = (Number(summary.recaudacion_aprobada) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <div>
      <AppBreadcrumb items={[{ label: "Operaciones", href: "/operaciones" }, { label: "Dashboard" }]} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{formatDateTime(new Date(), timezone)} · {timezone}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Operaciones de hoy</h1>
        </div>
        <Button onClick={() => navigate("/vuelos/nuevo")}><PlaneTakeoff className="size-4" /> Programar vuelo</Button>
      </div>

      <div className="relative mb-5 overflow-hidden rounded-2xl border border-sky-800/40 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-5 text-white shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] opacity-15 [background-size:16px_16px]" />
        <div className="pointer-events-none absolute right-0 top-1/2 hidden h-20 w-1/2 -translate-y-1/2 overflow-hidden md:block">
          <svg className="h-full w-full text-sky-400 opacity-30" viewBox="0 0 400 80" aria-hidden="true">
            <path d="M 10 60 Q 200 -20 390 40" fill="transparent" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
          <div className="absolute left-0 top-2 flex animate-plane-fly items-center gap-1.5 text-sky-300">
            <Plane className="size-5 rotate-45 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
            <span className="rounded border border-sky-600/50 bg-sky-900/80 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
              {summary.proximas_salidas?.[0]?.numero_vuelo ?? "LIVE AIRSPACE"}
            </span>
          </div>
        </div>
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" /></span>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-sky-400">Centro de Control Operativo · Hub GUA</span>
            </div>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-white">Monitoreo de Red &amp; Salidas Inmediatas</h3>
            <p className="mt-0.5 max-w-md text-xs text-slate-300">Supervisión en tiempo real de operaciones de cabina, abordaje de pasajeros y conciliación de caja.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase text-slate-400">Eficiencia de Flota</div>
              <div className="font-mono text-base font-bold text-sky-300">{summary.total_aviones ? Math.round(((summary.total_aviones - summary.aviones_mantenimiento) / summary.total_aviones) * 100) : 100}%</div>
            </div>
            <div className="h-8 w-px bg-slate-700/60" />
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase text-slate-400">Estado de Pasarela</div>
              <div className="flex items-center justify-end gap-1 text-xs font-semibold text-emerald-400"><span className="size-1.5 rounded-full bg-emerald-400" /> Operativa</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Kpi
          href="/vuelos"
          label="Vuelos activos"
          value={loading ? "—" : String(summary.vuelos_activos ?? 0)}
          context={`${summary.vuelos_abordando ?? 0} abordando · ${summary.vuelos_en_ruta ?? 0} en ruta`}
          icon={PlaneTakeoff}
        />
        <Kpi
          href="/ventas/reservas"
          label="Pasajeros del día"
          value={loading ? "—" : (summary.pasajeros_hoy ?? 0).toLocaleString("es-GT")}
          context={`${summary.reservas_hoy ?? 0} reservas confirmadas hoy`}
          icon={Users}
        />
        <Kpi
          href="/flota/aviones"
          label="Flota operativa"
          value={loading ? "—" : String(Math.max((summary.total_aviones ?? 0) - (summary.aviones_mantenimiento ?? 0), 0))}
          context="Aeronaves en estado nominal"
          icon={Wrench}
        />
        <Kpi
          href="/ventas/pagos"
          label="Recaudación conciliada"
          value={loading ? "—" : `$${money}`}
          context="Total conciliado en pasarela"
          icon={DollarSign}
        />
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800/80 dark:bg-card">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800/80">
          <div><h2 className="font-semibold">Próximas salidas</h2><p className="text-sm text-muted-foreground">Ordenadas por hora de salida</p></div>
          <Button variant="ghost" onClick={() => navigate("/vuelos")}>Ver todos <ArrowUpRight className="size-4" /></Button>
        </header>
        <Table className="hidden md:table">
          <TableHeader><TableRow className="bg-slate-50/75 text-left text-xs uppercase tracking-wider text-slate-400">{["Vuelo", "Ruta", "Aeronave", "Salida", "Puerta", "Estado"].map((heading) => <TableHead key={heading} className="px-4 py-3.5 font-semibold">{heading}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{upcoming.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">No hay salidas programadas para las próximas horas.</TableCell></TableRow> : upcoming.map((flight, index) => <TableRow key={flight.id ?? `flight-${index}`} onClick={() => flight.id && navigate(`/vuelos/${flight.id}/despacho`)} className="cursor-pointer transition-colors hover:bg-orange-500/5"><TableCell className="px-5 py-3 font-mono font-medium">{flight.numero_vuelo ?? "—"}</TableCell><TableCell className="px-5 py-3 font-mono font-semibold text-foreground">{flight.origen_iata ?? "???"} <span className="text-orange-500">➔</span> {flight.destino_iata ?? "???"}</TableCell><TableCell className="px-5 py-3 text-muted-foreground">{flight.matricula ?? "Sin asignar"}</TableCell><TableCell className="px-5 py-3 font-mono">{formatTime(flight.fecha_salida, timezone)}</TableCell><TableCell className="px-5 py-3 font-mono">{flight.puerta ?? "—"}</TableCell><TableCell className="px-5 py-3"><FlightBadge value={flight.estado} /></TableCell></TableRow>)}</TableBody>
        </Table>
        <ul className="divide-y divide-border md:hidden">{upcoming.map((flight, index) => <li key={flight.id ?? `flight-${index}`} onClick={() => flight.id && navigate(`/vuelos/${flight.id}/despacho`)} className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-orange-500/5"><div><div className="font-mono text-sm font-semibold">{flight.numero_vuelo ?? "—"} · {flight.origen_iata ?? "???"} <span className="text-orange-500">➔</span> {flight.destino_iata ?? "???"}</div><div className="mt-0.5 text-xs text-muted-foreground">{formatTime(flight.fecha_salida, timezone)} · Puerta {flight.puerta ?? "—"} · {flight.matricula ?? "Sin asignar"}</div></div><FlightBadge value={flight.estado} /></li>)}</ul>
        {loading && <div className="px-5 py-10 text-center text-sm text-muted-foreground">Cargando salidas...</div>}
        {!loading && !error && upcoming.length === 0 && <div className="px-5 py-10 text-center text-sm text-muted-foreground">No hay salidas programadas para hoy.</div>}
      </section>
    </div>
  );
}
