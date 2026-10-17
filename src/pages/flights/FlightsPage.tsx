import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Plus, Search } from "lucide-react";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAirports, type Airport } from "@/services/airportService";
import { getAirlines, type Airline } from "@/services/airlineService";
import { getPlanes, type Plane } from "@/services/planeService";
import { getRoutes, type Route } from "@/services/routeService";
import { getGates, type Gate } from "@/services/gateService";
import {
  createFlight,
  getFlights,
  updateFlight,
  type CreateFlightDTO,
  type Flight,
  type FlightStatus,
} from "@/services/flightService";

const statuses: FlightStatus[] = [
  "PROGRAMADO",
  "ABORDANDO",
  "EN_VUELO",
  "FINALIZADO",
  "CANCELADO",
];
type Draft = CreateFlightDTO & {
  id: number;
  fechaSalida: string;
  fechaLlegada: string;
};
const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";
const localDate = (value: string) => value.slice(0, 16);

function statusVariant(status: FlightStatus) {
  return status === "CANCELADO"
    ? "destructive"
    : status === "FINALIZADO"
      ? "secondary"
      : ("default" as const);
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function Flights() {
  const navigate = useNavigate();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [planes, setPlanes] = useState<Plane[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [detail, setDetail] = useState<Flight | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [f, a, p, r, g, ap] = await Promise.all([
          getFlights(),
          getAirlines(),
          getPlanes(),
          getRoutes(),
          getGates(),
          getAirports(),
        ]);
        setFlights(f);
        setAirlines(a);
        setPlanes(p);
        setRoutes(r);
        setGates(g);
        setAirports(ap);
      } catch {
        setNotice("No se pudieron cargar los vuelos");
      }
    };
    void load();
  }, []);
  const routeLabel = (id: number) => {
    const route = routes.find((item) => item.id === id);
    if (!route) return "—";
    return `${airports.find((airport) => airport.id === route.aeropuertoOrigenId)?.codigoIata ?? "—"} → ${airports.find((airport) => airport.id === route.aeropuertoDestinoId)?.codigoIata ?? "—"}`;
  };
  const routeName = (id: number) => {
    const route = routes.find((item) => item.id === id);
    return route
      ? `${airports.find((airport) => airport.id === route.aeropuertoOrigenId)?.ciudad ?? "—"} – ${airports.find((airport) => airport.id === route.aeropuertoDestinoId)?.ciudad ?? "—"}`
      : "—";
  };
  const plane = (id: number) => planes.find((item) => item.id === id);
  const rows = flights.filter(
    (flight) =>
      (!filter || flight.estado === filter) &&
      `${flight.numeroVuelo} ${routeLabel(flight.rutaId)} ${plane(flight.avionId)?.matricula ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const openEdit = (flight: Flight) =>
    setDraft({
      ...flight,
      fechaSalida: localDate(flight.fechaSalida),
      fechaLlegada: localDate(flight.fechaLlegada),
    });
  const valid =
    !!draft?.aerolineaId &&
    !!draft.avionId &&
    !!draft.rutaId &&
    !!draft.numeroVuelo &&
    new Date(draft.fechaLlegada).getTime() >
      new Date(draft.fechaSalida).getTime();
  const save = async () => {
    if (!draft || !valid) return;
    const payload = {
      ...draft,
      fechaSalida: new Date(draft.fechaSalida).toISOString(),
      fechaLlegada: new Date(draft.fechaLlegada).toISOString(),
    };
    try {
      const result = draft.id
        ? await updateFlight(draft.id, payload)
        : await createFlight(payload);
      setFlights((items) =>
        draft.id
          ? items.map((item) => (item.id === result.id ? result : item))
          : [...items, result],
      );
      setDraft(null);
      setNotice("Vuelo guardado");
    } catch {
      setNotice("No se pudo guardar el vuelo");
    }
  };

  return (
    <div>
      <AppBreadcrumb
        items={[{ label: "Operaciones", href: "/operaciones" }, { label: "Vuelos" }]}
      />
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Vuelos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {flights.length} vuelos registrados
          </p>
        </div>
        <Button onClick={() => navigate("/vuelos/nuevo")}>
          <Plus className="size-4" /> Programar vuelo
        </Button>
      </div>
      {notice && (
        <div className="mb-4 rounded-md border border-accent/30 bg-accent/5 px-4 py-2 text-sm">
          {notice}
        </div>
      )}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap gap-3 border-b border-border p-4">
          <div className="relative min-w-52 flex-1 md:max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9"
              placeholder="Buscar vuelo, ruta o matrícula"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            className={inputClass}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Estado"
          >
            <option value="">Todos los estados</option>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Vuelo</TableHead>
                <TableHead>Aerolínea</TableHead>
                <TableHead>Aeronave</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((flight) => (
                <TableRow key={flight.id}>
                  <TableCell className="font-mono font-medium">
                    {flight.numeroVuelo}
                  </TableCell>
                  <TableCell>
                    {airlines.find(
                      (airline) => airline.id === flight.aerolineaId,
                    )?.nombre ?? "—"}
                  </TableCell>
                  <TableCell>
                    {plane(flight.avionId)?.matricula ?? "—"}
                    <span className="block text-xs text-muted-foreground">
                      {plane(flight.avionId)?.nombre}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">
                      {routeLabel(flight.rutaId)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {routeName(flight.rutaId)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {localDate(flight.fechaSalida).replace("T", " ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(flight.estado)}>
                      {flight.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${flight.numeroVuelo}`}
                      onClick={() => openEdit(flight)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetail(flight)}
                    >
                      Ver
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/vuelos/${flight.id}/asientos`}>Precios</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="p-10 text-center text-muted-foreground"
                  >
                    Sin vuelos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vuelo {detail?.numeroVuelo}</DialogTitle>
            <DialogDescription>
              {detail && routeLabel(detail.rutaId)}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <dl className="divide-y divide-border text-sm">
              <div className="flex justify-between py-2">
                <dt>Estado</dt>
                <dd>
                  <Badge variant={statusVariant(detail.estado)}>
                    {detail.estado}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt>Aerolínea</dt>
                <dd>
                  {airlines.find((airline) => airline.id === detail.aerolineaId)
                    ?.nombre ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt>Puerta</dt>
                <dd>
                  {gates.find((gate) => gate.id === detail.puertaEmbarqueId)
                    ?.numero ?? "Sin asignar"}
                </dd>
              </div>
            </dl>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                if (detail) openEdit(detail);
                setDetail(null);
              }}
            >
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? "Editar vuelo" : "Programar vuelo"}
            </DialogTitle>
            <DialogDescription>
              Configura los datos del vuelo.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4">
              <Field label="Aerolínea">
                <select
                  className={inputClass}
                  value={draft.aerolineaId || ""}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      aerolineaId: Number(event.target.value),
                      avionId: 0,
                    })
                  }
                >
                  <option value="">Seleccionar</option>
                  {airlines.map((airline) => (
                    <option key={airline.id} value={airline.id}>
                      {airline.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Avión">
                <select
                  className={inputClass}
                  value={draft.avionId || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, avionId: Number(event.target.value) })
                  }
                >
                  <option value="">Seleccionar</option>
                  {planes
                    .filter(
                      (planeItem) =>
                        !draft.aerolineaId ||
                        planeItem.aerolineaId === draft.aerolineaId,
                    )
                    .map((planeItem) => (
                      <option key={planeItem.id} value={planeItem.id}>
                        {planeItem.matricula} · {planeItem.nombre}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Ruta">
                <select
                  className={inputClass}
                  value={draft.rutaId || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, rutaId: Number(event.target.value) })
                  }
                >
                  <option value="">Seleccionar</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {routeLabel(route.id)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Puerta">
                <select
                  className={inputClass}
                  value={draft.puertaEmbarqueId ?? ""}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      puertaEmbarqueId: event.target.value
                        ? Number(event.target.value)
                        : null,
                    })
                  }
                >
                  <option value="">Sin asignar</option>
                  {gates.map((gate) => (
                    <option key={gate.id} value={gate.id}>
                      {gate.numero}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Número de vuelo">
                <Input
                  value={draft.numeroVuelo}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      numeroVuelo: event.target.value.toUpperCase(),
                    })
                  }
                />
              </Field>
              <Field label="Salida">
                <Input
                  type="datetime-local"
                  value={draft.fechaSalida}
                  onChange={(event) =>
                    setDraft({ ...draft, fechaSalida: event.target.value })
                  }
                />
              </Field>
              <Field label="Llegada">
                <Input
                  type="datetime-local"
                  value={draft.fechaLlegada}
                  onChange={(event) =>
                    setDraft({ ...draft, fechaLlegada: event.target.value })
                  }
                />
              </Field>
              <Field label="Estado">
                <select
                  className={inputClass}
                  value={draft.estado}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      estado: event.target.value as FlightStatus,
                    })
                  }
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
            <Button disabled={!valid} onClick={save}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
