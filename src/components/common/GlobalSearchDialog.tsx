import { useEffect, useMemo, useRef, useState, type ComponentType, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Armchair,
  ArrowLeftRight,
  CreditCard,
  Database,
  History,
  LayoutDashboard,
  Loader2,
  Plane,
  Search,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
} from "@/components/ui/command";
import { getFlights, type Flight } from "@/services/flightService";
import { cn } from "@/lib/utils";
import { isAdministrator } from "@/lib/auth";

const STATIC_ROUTES = [
  { label: "Dashboard General", path: "/operaciones/dashboard", group: "Operaciones", icon: LayoutDashboard, keywords: ["inicio", "metricas", "kpi", "resumen"] },
  { label: "Vuelos y Programación", path: "/operaciones/vuelos", group: "Operaciones", icon: Plane, keywords: ["itinerarios", "vuelos", "salidas", "llegadas"] },
  { label: "Reasignaciones por Contingencia", path: "/operaciones/reasignaciones", group: "Operaciones", icon: ArrowLeftRight, keywords: ["cancelaciones", "cambio", "reubicar"] },
  { label: "Aviones y Flota", path: "/flota/aviones", group: "Flota", icon: Plane, keywords: ["aeronaves", "matriculas", "capacidad", "aerolineas"] },
  { label: "Mapas de Asientos y Cabina", path: "/flota/mapa-asientos", group: "Flota", icon: Armchair, keywords: ["configuracion", "cabina", "filas", "asientos"] },
  { label: "Catálogos Base", path: "/infraestructura/catalogos", group: "Infraestructura", icon: Database, keywords: ["aeropuertos", "terminales", "puertas", "rutas"] },
  { label: "Panel de Reservas", path: "/ventas/reservas", group: "Ventas", icon: Ticket, keywords: ["boletos", "tickets", "pnr", "pasajeros", "compras"] },
  { label: "Conciliación de Pagos", path: "/ventas/pagos", group: "Ventas", icon: CreditCard, keywords: ["caja", "tarjetas", "transacciones", "ingresos", "metodos"] },
  { label: "Bitácora de Asientos", path: "/seguridad/bitacora", group: "Seguridad y Auditoría", icon: History, keywords: ["auditoria", "trazabilidad", "logs", "cambios"] },
  { label: "Roles y Seguridad", path: "/seguridad/roles", group: "Seguridad y Auditoría", icon: ShieldCheck, keywords: ["permisos", "usuarios", "errores", "accesos"] },
] as const;

type GlobalSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SearchResult = {
  id: string;
  path: string;
  label: string;
  group: string;
  icon: ComponentType<LucideProps>;
};

const normalize = (value: string | number | null | undefined) =>
  String(value ?? "").trim().toLocaleLowerCase();

const flightNumber = (flight: Flight) => flight.numero_vuelo ?? flight.numeroVuelo;
const origin = (flight: Flight) =>
  flight.ruta?.aeropuerto_origen?.codigo_iata ??
  flight.aeropuerto_origen?.codigo_iata ??
  flight.ruta?.aeropuerto_origen?.ciudad ??
  flight.aeropuerto_origen?.ciudad ??
  "Origen";
const destination = (flight: Flight) =>
  flight.ruta?.aeropuerto_destino?.codigo_iata ??
  flight.aeropuerto_destino?.codigo_iata ??
  flight.ruta?.aeropuerto_destino?.ciudad ??
  flight.aeropuerto_destino?.ciudad ??
  "Destino";

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [flightError, setFlightError] = useState("");
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const flightsLoaded = useRef(false);
  const flightsLoading = useRef(false);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open || flightsLoaded.current || flightsLoading.current) return;
    flightsLoading.current = true;
    const loadingTimeout = window.setTimeout(() => setLoadingFlights(true), 0);
    void getFlights()
      .then((loadedFlights) => {
        setFlights(loadedFlights);
        flightsLoaded.current = true;
      })
      .catch((cause: unknown) => {
        setFlightError(cause instanceof Error ? cause.message : "No se pudieron cargar los vuelos.");
      })
      .finally(() => {
        flightsLoading.current = false;
        setLoadingFlights(false);
      });
    return () => window.clearTimeout(loadingTimeout);
  }, [open]);

  const normalizedQuery = normalize(query);
  const matchingFlights = useMemo(() => {
    if (!normalizedQuery) return [];
    return flights
      .filter((flight) =>
        [flight.id, flightNumber(flight), flight.avion?.matricula]
          .some((value) => normalize(value).includes(normalizedQuery)),
      )
      .slice(0, 8);
  }, [flights, normalizedQuery]);

  const availableRoutes = STATIC_ROUTES.filter(
    (route) => route.path !== "/seguridad/roles" || isAdministrator(),
  );
  const filteredRoutes = useMemo(
    () => availableRoutes.filter((route) =>
      !normalizedQuery ||
      [route.label, route.path, ...route.keywords]
        .some((value) => normalize(value).includes(normalizedQuery)),
    ),
    [availableRoutes, normalizedQuery],
  );
  const staticRouteMatch = filteredRoutes.length > 0 && normalizedQuery.length > 0;
  const showReservationSearch = normalizedQuery.length >= 3 && !staticRouteMatch;

  const results = useMemo<SearchResult[]>(() => [
    ...matchingFlights.map((flight) => ({
      id: `flight-${flight.id}`,
      path: `/vuelos/${flight.id}/despacho`,
      label: `${flightNumber(flight) ?? `Vuelo #${flight.id}`} · ${origin(flight)} → ${destination(flight)} · Matrícula: ${flight.avion?.matricula ?? "—"} · (${flight.estado})`,
      group: "Vuelos Operativos",
      icon: Plane,
    })),
    ...(showReservationSearch
      ? [{
          id: "reservation-search",
          path: `/ventas/reservas?q=${encodeURIComponent(query.trim())}`,
          label: `Buscar reserva / boleto: “${query.trim()}” en Ventas`,
          group: "Ventas y Reservas",
          icon: Ticket,
        }]
      : []),
    ...filteredRoutes.map((route) => ({
      id: route.path,
      path: route.path,
      label: route.label,
      group: route.group,
      icon: route.icon,
    })),
  ], [filteredRoutes, matchingFlights, query, showReservationSearch]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
    setQuery("");
    setSelectedIndex(0);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((previous) => (previous + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((previous) => (previous - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleNavigate(results[selectedIndex]?.path ?? results[0].path);
    }
  };

  const renderResult = (result: SearchResult, index: number) => {
    const Icon = result.icon;
    return (
      <button
        key={result.id}
        type="button"
        onClick={() => handleNavigate(result.path)}
        onMouseEnter={() => setSelectedIndex(index)}
        className={cn(
          "group flex w-full items-center justify-between rounded-md border-l-2 border-transparent px-3 py-2 text-left text-xs transition-colors",
          "hover:bg-primary/10 hover:text-orange-600 focus:bg-primary/10 focus:text-orange-600 focus:outline-none",
          "dark:hover:bg-orange-500/15 dark:focus:bg-orange-500/15",
          index === selectedIndex && "border-orange-500 bg-orange-500/10 pl-2.5 font-medium text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
        )}
        aria-current={index === selectedIndex ? "true" : undefined}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Icon className={cn(
            "size-4 shrink-0 text-muted-foreground group-focus:text-orange-500 group-hover:text-orange-500",
            index === selectedIndex && "text-orange-500",
          )} />
          <span className="truncate">{result.label}</span>
        </span>
        <span className={cn(
          "ml-3 shrink-0 text-[11px] font-normal text-muted-foreground",
          "group-focus:text-orange-600/70 group-hover:text-orange-600/70 dark:group-focus:text-orange-400/80 dark:group-hover:text-orange-400/80",
          index === selectedIndex && "text-orange-600/70 dark:text-orange-400/80",
        )}>
          {result.group}
        </span>
      </button>
    );
  };

  const flightResults = results.filter((result) => result.group === "Vuelos Operativos");
  const reservationResults = results.filter((result) => result.group === "Ventas y Reservas");
  const routeResults = results.filter(
    (result) => result.group !== "Vuelos Operativos" && result.group !== "Ventas y Reservas",
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setQuery("");
          setSelectedIndex(0);
        }
      }}
    >
      <CommandInput
        autoFocus
        placeholder="Buscar módulo, vuelo, matrícula o reserva..."
        value={query}
        onValueChange={handleQueryChange}
        onKeyDown={handleInputKeyDown}
        className="focus-visible:ring-1 focus-visible:ring-primary"
      />
      <CommandList className="p-1">
        {!loadingFlights && results.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No se encontraron resultados.</p>
        )}
        {loadingFlights && (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Cargando vuelos operativos...
          </div>
        )}
        {flightError && (
          <p className="px-3 py-2 text-xs text-destructive">
            No se pudo consultar vuelos: {flightError}
          </p>
        )}
        {flightResults.length > 0 && (
          <CommandGroup heading="Vuelos Operativos">
            {flightResults.map((result) => renderResult(result, results.indexOf(result)))}
          </CommandGroup>
        )}
        {reservationResults.length > 0 && (
          <CommandGroup heading="Ventas y Reservas">
            {reservationResults.map((result) => renderResult(result, results.indexOf(result)))}
          </CommandGroup>
        )}
        {routeResults.length > 0 && (
          <CommandGroup heading="Módulos del sistema">
            {routeResults.map((result) => renderResult(result, results.indexOf(result)))}
          </CommandGroup>
        )}
      </CommandList>
      <div className="flex items-center justify-between border-t px-3 py-2 text-[11px] text-muted-foreground">
        <span><Search className="mr-1 inline size-3" /> Navega con ↑ ↓ y Enter</span>
        <span>Esc para cerrar</span>
      </div>
    </CommandDialog>
  );
}
