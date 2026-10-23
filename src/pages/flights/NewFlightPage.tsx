import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  PlaneTakeoff,
  RefreshCw,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAirlines, type Airline } from "@/services/airlineService";
import { getAirports, type Airport } from "@/services/airportService";
import { getAvailablePlanes, type Plane } from "@/services/planeService";
import { getRoutes, type Route } from "@/services/routeService";
import { getGates, type Gate } from "@/services/gateService";
import { getTerminals, type Terminal } from "@/services/terminalService";
import { createFlight, type CreateFlightDTO } from "@/services/flightService";
import { generarNumeroVuelo } from "@/lib/utils";
import { formatearFechaGlobal } from "@/utils/dateUtils";
import { usePreferences } from "@/contexts/usePreferences";

const steps = ["Ruta", "Horarios", "Aeronave y puerta"];
const capacityFilters = [0, 150, 180, 250];
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {hint && (
        <span className="text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      )}
    </label>
  );
}
function formatDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
function formatTime(value: Date) {
  return `${String(value.getHours()).padStart(2, "0")}:${String(
    value.getMinutes(),
  ).padStart(2, "0")}`;
}

function AirportPicker({
  airports,
  value,
  placeholder,
  onChange,
}: {
  airports: Airport[];
  value: number | null;
  placeholder: string;
  onChange: (value: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedAirport = airports.find((airport) => airport.id === value);
  const filteredAirports = airports.filter((airport) =>
    `${airport.codigoIata} ${airport.codigoIcao} ${airport.nombre} ${airport.ciudad} ${airport.pais}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  const close = () => {
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
      modal={false}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between text-left font-normal"
        >
          {selectedAirport ? (
            <span className="truncate">
              <span className="font-semibold">{selectedAirport.codigoIata}</span>
              <span className="ml-2 text-muted-foreground">
                {selectedAirport.ciudad} · {selectedAirport.pais}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ArrowRight className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              placeholder="Buscar por IATA, ciudad, país o aeropuerto..."
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") close();
                if (event.key === "Enter" && filteredAirports[0]) {
                  onChange(filteredAirports[0].id);
                  close();
                }
              }}
              className="h-11 border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filteredAirports.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No se encontraron aeropuertos.
              </p>
            ) : (
              filteredAirports.map((airport) => (
                <button
                  key={airport.id}
                  type="button"
                  role="option"
                  aria-selected={airport.id === value}
                  className="flex w-full cursor-pointer items-center rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  onClick={() => {
                    onChange(airport.id);
                    close();
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 shrink-0 ${airport.id === value ? "opacity-100" : "opacity-0"}`}
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold">
                      {airport.codigoIata} · {airport.nombre}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {airport.ciudad} · {airport.pais}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Wizard() {
  const navigate = useNavigate();
  const { timezone } = usePreferences();
  const [step, setStep] = useState(0);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [availablePlanes, setAvailablePlanes] = useState<Plane[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [selectedOriginAirportId, setSelectedOriginAirportId] = useState<number | null>(null);
  const [selectedDestinationAirportId, setSelectedDestinationAirportId] = useState<number | null>(null);
  const [selectedPlaneId, setSelectedPlaneId] = useState<number | null>(null);
  const [minimumCapacity, setMinimumCapacity] = useState(0);
  const [flightNumber, setFlightNumber] = useState(() => generarNumeroVuelo());
  const [selectedGateId, setSelectedGateId] = useState<number | null>(null);
  const [openPlaneCombo, setOpenPlaneCombo] = useState(false);
  const [openGateCombo, setOpenGateCombo] = useState(false);
  const [planeSearch, setPlaneSearch] = useState("");
  const [gateSearch, setGateSearch] = useState("");
  const initialDate = new Date();
  initialDate.setDate(initialDate.getDate() + 1);
  const [departureDate, setDepartureDate] = useState(formatDate(initialDate));
  const [departureTime, setDepartureTime] = useState("09:30");
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const availabilityRequest = useRef(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [
          loadedRoutes,
          loadedGates,
          loadedAirports,
          loadedAirlines,
          loadedTerminals,
        ] =
          await Promise.all([
            getRoutes(),
            getGates(),
            getAirports(),
            getAirlines(),
            getTerminals(),
          ]);
        setRoutes(loadedRoutes);
        setGates(loadedGates);
        setAirports(loadedAirports);
        setAirlines(loadedAirlines);
        setTerminals(loadedTerminals);
      } catch {
        setNotice("No se pudieron cargar los catálogos");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);
  const departureISO = `${departureDate}T${departureTime}:00-06:00`;
  const selectedRoute = routes.find((item) => item.id === selectedRouteId);
  const selectedOriginAirport = airports.find(
    (airport) => airport.id === selectedOriginAirportId,
  );
  const selectedDestinationAirport = airports.find(
    (airport) => airport.id === selectedDestinationAirportId,
  );
  const plane = availablePlanes.find((item) => item.id === selectedPlaneId);
  const routeLabel = (item: Route) =>
    `${airports.find((airport) => airport.id === item.aeropuertoOrigenId)?.codigoIata ?? "—"} → ${airports.find((airport) => airport.id === item.aeropuertoDestinoId)?.codigoIata ?? "—"}`;
  const isPlaneSelectable = (item: Plane) => item.capacidad > 0;
  const planeOptions = availablePlanes.filter((item) => {
    if (!item.activo || item.capacidad < minimumCapacity) return false;
    const airline = airlines.find(
      (candidate) => candidate.id === item.aerolineaId,
    );
    return `${item.matricula} ${item.nombre ?? ""} ${airline?.nombre ?? ""}`
      .toLocaleLowerCase()
      .includes(planeSearch.toLocaleLowerCase());
  });
  const validGates = gates.filter((gate) => {
    const terminal = terminals.find((item) => item.id === gate.sedeId);
    return (
      gate.activo && terminal?.aeropuertoId === selectedRoute?.aeropuertoOrigenId
      && `Puerta ${gate.numero} ${terminal?.nombre ?? ""}`
        .toLocaleLowerCase()
        .includes(gateSearch.toLocaleLowerCase())
    );
  });
  const updateAirportSelection = (
    originId: number | null,
    destinationId: number | null,
  ) => {
    const route = routes.find(
      (item) =>
        item.activa &&
        item.aeropuertoOrigenId === originId &&
        item.aeropuertoDestinoId === destinationId,
    );
    setSelectedOriginAirportId(originId);
    setSelectedDestinationAirportId(destinationId);
    setSelectedRouteId(route?.id ?? null);
    setRouteDuration(route?.duracionEstimada ?? null);
    setSelectedPlaneId(null);
    setSelectedGateId(null);
  };
  const calculatedArrival =
    routeDuration !== null &&
    Number.isFinite(routeDuration) &&
    departureDate &&
    departureTime
      ? new Date(
          new Date(`${departureDate}T${departureTime}:00`).getTime() +
            routeDuration * 60_000,
        )
      : null;
  const arrivalDate = calculatedArrival
    ? formatDate(calculatedArrival)
    : formatDate(initialDate);
  const arrivalTime = calculatedArrival
    ? formatTime(calculatedArrival)
    : "11:30";
  const timesValid =
    `${arrivalDate}T${arrivalTime}` > `${departureDate}T${departureTime}`;
  const arrivalISO = `${arrivalDate}T${arrivalTime}:00-06:00`;
  const canContinue =
    step === 0
      ? !!selectedRouteId
      : step === 1
        ? timesValid
        : !!selectedPlaneId && !!selectedGateId && !!flightNumber.trim();
  const advanceStep = async () => {
    if (step === 1) {
      const requestId = ++availabilityRequest.current;
      setSelectedPlaneId(null);
      setAvailablePlanes([]);
      setAvailabilityLoading(true);
      setStep(2);
      try {
        const planes = await getAvailablePlanes(departureISO, arrivalISO);
        if (requestId === availabilityRequest.current) {
          setAvailablePlanes(planes);
        }
      } catch {
        if (requestId === availabilityRequest.current) {
          setNotice("No se pudieron consultar las aeronaves disponibles");
        }
      } finally {
        if (requestId === availabilityRequest.current) {
          setAvailabilityLoading(false);
        }
      }
      return;
    }
    setStep(step + 1);
  };
  const submit = async () => {
    if (!selectedRoute || !plane || !selectedGateId || !timesValid) return;
    const payload: CreateFlightDTO = {
      aerolineaId: plane.aerolineaId,
      avionId: plane.id,
      rutaId: selectedRoute.id,
      puertaEmbarqueId: selectedGateId,
      numeroVuelo: flightNumber.trim(),
      fechaSalida: new Date(
        `${departureDate}T${departureTime}:00-06:00`,
      ).toISOString(),
      fechaLlegada: new Date(
        `${arrivalDate}T${arrivalTime}:00-06:00`,
      ).toISOString(),
      estado: "PROGRAMADO",
    };
    try {
      const nuevoVuelo = await createFlight(payload);
      navigate(`/vuelos/${nuevoVuelo.id}/asientos`);
    } catch {
      setNotice("No se pudo programar el vuelo");
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate("/vuelos")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a vuelos
      </button>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Programar vuelo
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cada paso valida la integridad con Ruta, Avión y Puerta_embarque.
      </p>
      <ol className="mt-6 flex items-center">
        {steps.map((label, index) => (
          <li
            key={label}
            className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
          >
            <button
              disabled={index > step}
              onClick={() => setStep(index)}
              className="flex items-center gap-2.5 disabled:cursor-default"
            >
              <span
                className={`flex size-8 items-center justify-center rounded-full font-mono text-sm font-medium ${index < step ? "bg-ok text-white" : index === step ? "bg-primary text-white" : "border border-border bg-card text-muted-foreground"}`}
              >
                {index < step ? <Check className="size-4" /> : index + 1}
              </span>
              <span
                className={`hidden text-sm sm:block ${index === step ? "font-semibold" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <span
                className={`mx-3 h-px flex-1 ${index < step ? "bg-ok" : "bg-border"}`}
              />
            )}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:hidden">
        Paso {step + 1} de 3 · {steps[step]}
      </p>
      {notice && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {notice}
        </div>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="rounded-xl">
          <CardContent className="p-5 md:p-7">
            {loading ? (
              <p className="py-12 text-center text-muted-foreground">
                Cargando catálogos…
              </p>
            ) : (
              <>
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Seleccionar ruta
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Solo se muestran rutas activas.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Punto de salida">
                        <AirportPicker
                          airports={airports.filter((airport) => airport.activo !== false)}
                          value={selectedOriginAirportId}
                          placeholder="Seleccionar aeropuerto de salida..."
                          onChange={(value) =>
                            updateAirportSelection(value, selectedDestinationAirportId)
                          }
                        />
                      </Field>
                      <Field label="Punto de llegada o aterrizaje">
                        <AirportPicker
                          airports={airports.filter((airport) => airport.activo !== false)}
                          value={selectedDestinationAirportId}
                          placeholder="Seleccionar aeropuerto de llegada..."
                          onChange={(value) =>
                            updateAirportSelection(selectedOriginAirportId, value)
                          }
                        />
                      </Field>
                    </div>
                    {selectedOriginAirport && selectedDestinationAirport && !selectedRoute && (
                      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        No existe una ruta activa entre estos aeropuertos.
                      </p>
                    )}
                    {selectedRoute && (
                      <div className="grid grid-cols-3 gap-3 rounded-lg bg-background p-4">
                        {[
                          [
                            "Origen",
                            airports.find(
                              (airport) =>
                                airport.id === selectedRoute.aeropuertoOrigenId,
                            )?.nombre ?? "—",
                          ],
                          [
                            "Destino",
                            airports.find(
                              (airport) =>
                                airport.id === selectedRoute.aeropuertoDestinoId,
                            )?.nombre ?? "—",
                          ],
                          ["Duración est.", `${selectedRoute.duracionEstimada} min`],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                              {label}
                            </div>
                            <div className="mt-1 text-sm font-medium">
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Seleccionar aeronave
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Selecciona una aeronave disponible para el horario y asigna la puerta.
                      </p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Número de vuelo">
                        <div className="flex gap-2">
                          <Input
                            className="font-mono"
                            value={flightNumber}
                            onChange={(event) =>
                              setFlightNumber(event.target.value.toUpperCase())
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            title="Generar otro código"
                            aria-label="Generar otro código"
                            onClick={() => {
                              const airlineCode = plane
                                ? airlines.find(
                                    (airline) => airline.id === plane.aerolineaId,
                                  )?.codigoIata
                                : undefined;
                              setFlightNumber(
                                generarNumeroVuelo(airlineCode || "AX"),
                              );
                            }}
                          >
                            <RefreshCw className="size-4" />
                          </Button>
                        </div>
                      </Field>
                      <Field label="Puerta de embarque">
                        <Popover
                          open={openGateCombo}
                          onOpenChange={setOpenGateCombo}
                          modal={false}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 w-full justify-between font-normal"
                            >
                              {selectedGateId ? (
                                <span className="truncate text-left">
                                  Puerta{" "}
                                  {gates.find((gate) => gate.id === selectedGateId)?.numero}
                                </span>
                              ) : (
                                "Seleccionar puerta..."
                              )}
                              <ArrowRight className="ml-2 size-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <div className="bg-popover text-popover-foreground">
                              <div className="flex items-center border-b px-3">
                                <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                                <Input
                                  autoFocus
                                  value={gateSearch}
                                  placeholder="Buscar número o terminal..."
                                  onChange={(event) => setGateSearch(event.target.value)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Escape") setOpenGateCombo(false);
                                    if (event.key === "Enter" && validGates[0]) {
                                      setSelectedGateId(validGates[0].id);
                                      setOpenGateCombo(false);
                                    }
                                  }}
                                  className="h-11 border-0 px-0 shadow-none focus-visible:ring-0"
                                />
                              </div>
                              <div role="listbox" className="max-h-60 overflow-y-auto p-1">
                                {validGates.length === 0 ? (
                                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                                    No hay puertas disponibles en el aeropuerto de origen.
                                  </p>
                                ) : (
                                  validGates.map((gate) => (
                                    <button
                                      key={gate.id}
                                      type="button"
                                      role="option"
                                      className="flex w-full cursor-pointer items-start rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                      onClick={() => {
                                        setSelectedGateId(gate.id);
                                        setOpenGateCombo(false);
                                        setGateSearch("");
                                      }}
                                    >
                                      <span>
                                        <span className="block font-semibold">
                                          Puerta {gate.numero}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                          {terminals.find(
                                            (terminal) => terminal.id === gate.sedeId,
                                          )?.nombre ?? "Terminal no disponible"}
                                        </span>
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </Field>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {capacityFilters.map((capacity) => (
                        <button
                          key={capacity}
                          onClick={() => {
                            setMinimumCapacity(capacity);
                            setSelectedPlaneId(null);
                          }}
                          className={`h-8 rounded-full border px-3.5 font-mono text-xs ${minimumCapacity === capacity ? "border-primary bg-primary text-white" : "border-border hover:bg-muted"}`}
                        >
                          {capacity === 0 ? "Todas" : `${capacity}+`}
                        </button>
                      ))}
                    </div>
                    <Field label="Avión">
                      <Popover
                        open={openPlaneCombo}
                        onOpenChange={setOpenPlaneCombo}
                        modal={false}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-full justify-between font-normal"
                          >
                            {plane ? (
                              <span className="truncate text-left">
                                {plane.matricula} · {airlines.find((airline) => airline.id === plane.aerolineaId)?.nombre ?? "Aerolínea no disponible"} ({plane.capacidad} pax)
                              </span>
                            ) : (
                              "Seleccionar aeronave..."
                            )}
                            <ArrowRight className="ml-2 size-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <div className="bg-popover text-popover-foreground">
                            <div className="flex items-center border-b px-3">
                              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                              <Input
                                autoFocus
                                value={planeSearch}
                                placeholder="Buscar matrícula, modelo o aerolínea..."
                                onChange={(event) => setPlaneSearch(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Escape") setOpenPlaneCombo(false);
                                  const firstSelectablePlane = planeOptions.find(
                                    (item) => isPlaneSelectable(item),
                                  );
                                  if (event.key === "Enter" && firstSelectablePlane) {
                                    setSelectedPlaneId(firstSelectablePlane.id);
                                    const airline = airlines.find(
                                      (candidate) =>
                                        candidate.id === firstSelectablePlane.aerolineaId,
                                    );
                                    setFlightNumber(
                                      generarNumeroVuelo(airline?.codigoIata || "AX"),
                                    );
                                    setOpenPlaneCombo(false);
                                  }
                                }}
                                className="h-11 border-0 px-0 shadow-none focus-visible:ring-0"
                              />
                            </div>
                            <div role="listbox" className="max-h-60 overflow-y-auto p-1">
                              {availabilityLoading ? (
                                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                                  Consultando aeronaves disponibles…
                                </p>
                              ) : planeOptions.length === 0 ? (
                                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                                  No hay aeronaves disponibles para este horario.
                                </p>
                              ) : (
                                planeOptions.map((item) => {
                                  const airline = airlines.find((candidate) => candidate.id === item.aerolineaId);
                                  const selectable = isPlaneSelectable(item);
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      role="option"
                                      disabled={!selectable}
                                      className="flex w-full items-start rounded-sm px-2 py-2 text-left text-sm outline-none enabled:cursor-pointer enabled:hover:bg-accent enabled:hover:text-accent-foreground enabled:focus:bg-accent enabled:focus:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
                                      onClick={() => {
                                        if (!selectable) return;
                                        setSelectedPlaneId(item.id);
                                        setFlightNumber(
                                          generarNumeroVuelo(
                                            airline?.codigoIata || "AX",
                                          ),
                                        );
                                        setOpenPlaneCombo(false);
                                        setPlaneSearch("");
                                      }}
                                    >
                                      <span className="flex w-full items-start justify-between gap-3">
                                        <span>
                                          <span className="block font-semibold">
                                            {item.matricula} · {item.nombre ?? "Aeronave"}
                                          </span>
                                          <span className="block text-xs text-muted-foreground">
                                            {selectable
                                              ? airline?.nombre ?? "Aerolínea no disponible"
                                              : "Sin distribución de asientos"}
                                          </span>
                                        </span>
                                        <Badge variant="secondary">
                                          {item.capacidad} pax
                                        </Badge>
                                      </span>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </Field>
                    {plane && (
                      <div className="flex items-center justify-between rounded-lg bg-background p-4">
                        <div>
                          <div className="font-medium">
                            {plane.nombre ?? "Aeronave"}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {plane.matricula} · {plane.capacidad} asientos
                          </div>
                        </div>
                        <Badge variant="secondary">Disponible</Badge>
                      </div>
                    )}
                  </div>
                )}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Definir horarios
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Configura la salida; la llegada se calcula automáticamente.
                      </p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Fecha de salida">
                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="date"
                            className="pr-10 font-mono"
                            value={departureDate}
                            onChange={(event) => {
                              setDepartureDate(event.target.value);
                              setSelectedPlaneId(null);
                            }}
                          />
                        </div>
                      </Field>
                      <Field
                        label="Fecha de llegada"
                        hint="Calculado automáticamente a partir de la duración de la ruta"
                      >
                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="date"
                            className="pr-10 font-mono"
                            value={arrivalDate}
                            disabled
                          />
                        </div>
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Hora salida">
                          <div className="relative">
                            <Clock className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="time"
                              className="pr-10 font-mono"
                              value={departureTime}
                              onChange={(event) => {
                                setDepartureTime(event.target.value);
                                setSelectedPlaneId(null);
                              }}
                            />
                          </div>
                        </Field>
                        <Field label="Hora llegada">
                          <div className="relative">
                            <Clock className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="time"
                              className="pr-10 font-mono"
                              value={arrivalTime}
                              disabled
                            />
                          </div>
                        </Field>
                      </div>
                    </div>
                    {!timesValid && (
                      <p className="text-sm text-destructive">
                        La llegada debe ser posterior a la salida.
                      </p>
                    )}
                  </div>
                )}
                <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (step === 0) {
                        navigate("/vuelos");
                        return;
                      }
                      if (step === 2) {
                        availabilityRequest.current += 1;
                        setSelectedPlaneId(null);
                        setAvailablePlanes([]);
                        setAvailabilityLoading(false);
                      }
                      setStep(step - 1);
                    }}
                  >
                    {step === 0 ? (
                      "Cancelar"
                    ) : (
                      <>
                        <ArrowLeft className="size-4" /> Atrás
                      </>
                    )}
                  </Button>
                  {step < 2 ? (
                    <Button
                      disabled={!canContinue}
                      onClick={() => void advanceStep()}
                    >
                      Continuar <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button disabled={!canContinue} onClick={submit}>
                      <PlaneTakeoff className="size-4" /> Programar vuelo
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="h-fit rounded-xl lg:sticky lg:top-0">
          <CardContent className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Resumen
            </h3>
            <dl className="mt-4 space-y-4 text-sm">
              {[
                ["Vuelo", flightNumber || "—"],
                [
                  "Ruta",
                  selectedRoute ? routeLabel(selectedRoute) : "Pendiente",
                ],
                [
                  "Aeronave",
                  plane
                    ? `${plane.matricula} · ${plane.capacidad} pax`
                    : "Pendiente",
                ],
                [
                  "Puerta",
                  selectedGateId
                    ? (gates.find((gate) => gate.id === selectedGateId)
                        ?.numero ?? "Pendiente")
                    : "Pendiente",
                ],
                [
                  "Salida",
                  formatearFechaGlobal(
                    `${departureDate}T${departureTime}:00-06:00`,
                    timezone,
                  ),
                ],
                [
                  "Llegada",
                  formatearFechaGlobal(
                    `${arrivalDate}T${arrivalTime}:00-06:00`,
                    timezone,
                  ),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-mono">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
