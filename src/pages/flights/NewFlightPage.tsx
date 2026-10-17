import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  PlaneTakeoff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAirlines, type Airline } from "@/services/airlineService";
import { getAirports, type Airport } from "@/services/airportService";
import { getPlanes, type Plane } from "@/services/planeService";
import { getRoutes, type Route } from "@/services/routeService";
import { getGates, type Gate } from "@/services/gateService";
import { getTerminals, type Terminal } from "@/services/terminalService";
import { createFlight, type CreateFlightDTO } from "@/services/flightService";

const steps = ["Ruta", "Aeronave", "Puerta y horarios"];
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

export default function Wizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [planes, setPlanes] = useState<Plane[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [selectedPlaneId, setSelectedPlaneId] = useState<number | null>(null);
  const [minimumCapacity, setMinimumCapacity] = useState(0);
  const [flightNumber, setFlightNumber] = useState("AX 812");
  const [selectedGateId, setSelectedGateId] = useState<number | null>(null);
  const [openRouteCombo, setOpenRouteCombo] = useState(false);
  const [openPlaneCombo, setOpenPlaneCombo] = useState(false);
  const [openGateCombo, setOpenGateCombo] = useState(false);
  const initialDate = new Date();
  initialDate.setDate(initialDate.getDate() + 1);
  const [departureDate, setDepartureDate] = useState(formatDate(initialDate));
  const [departureTime, setDepartureTime] = useState("09:30");
  const [arrivalDate, setArrivalDate] = useState(formatDate(initialDate));
  const [arrivalTime, setArrivalTime] = useState("11:30");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [
          loadedRoutes,
          loadedPlanes,
          loadedGates,
          loadedAirports,
          loadedAirlines,
          loadedTerminals,
        ] =
          await Promise.all([
            getRoutes(),
            getPlanes(),
            getGates(),
            getAirports(),
            getAirlines(),
            getTerminals(),
          ]);
        setRoutes(loadedRoutes);
        setPlanes(loadedPlanes);
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
  const selectedRoute = routes.find((item) => item.id === selectedRouteId);
  const plane = planes.find((item) => item.id === selectedPlaneId);
  const selectedGate = gates.find((item) => item.id === selectedGateId);
  const routeLabel = (item: Route) =>
    `${airports.find((airport) => airport.id === item.aeropuertoOrigenId)?.codigoIata ?? "—"} → ${airports.find((airport) => airport.id === item.aeropuertoDestinoId)?.codigoIata ?? "—"}`;
  const routeCity = (item: Route) =>
    `${airports.find((airport) => airport.id === item.aeropuertoOrigenId)?.ciudad ?? "—"} – ${airports.find((airport) => airport.id === item.aeropuertoDestinoId)?.ciudad ?? "—"}`;
  const routeOptions = routes.filter((item) => item.activa);
  const planeOptions = planes.filter(
    (item) => item.activo && item.capacidad >= minimumCapacity,
  );
  const validGates = gates.filter((gate) => {
    const terminal = terminals.find((item) => item.id === gate.sedeId);
    return (
      gate.activo && terminal?.aeropuertoId === selectedRoute?.aeropuertoOrigenId
    );
  });
  const timesValid =
    `${arrivalDate}T${arrivalTime}` > `${departureDate}T${departureTime}`;
  const canContinue =
    step === 0
      ? !!selectedRouteId
      : step === 1
        ? !!selectedPlaneId
        : !!selectedGateId && timesValid && !!flightNumber.trim();
  const submit = async () => {
    if (!selectedRoute || !plane || !selectedGateId || !timesValid) return;
    const payload: CreateFlightDTO = {
      aerolineaId: plane.aerolineaId,
      avionId: plane.id,
      rutaId: selectedRoute.id,
      puertaEmbarqueId: selectedGateId,
      numeroVuelo: flightNumber.trim(),
      fechaSalida: new Date(`${departureDate}T${departureTime}`).toISOString(),
      fechaLlegada: new Date(`${arrivalDate}T${arrivalTime}`).toISOString(),
      estado: "PROGRAMADO",
    };
    try {
      await createFlight(payload);
      navigate("/vuelos");
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
                    <Field label="Ruta (origen → destino)">
                      <Popover
                        open={openRouteCombo}
                        onOpenChange={setOpenRouteCombo}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-full justify-between font-normal"
                          >
                            {selectedRoute ? (
                              <span className="truncate text-left">
                                <span className="font-semibold">
                                  {routeLabel(selectedRoute)}
                                </span>
                                <span className="ml-2 text-muted-foreground">
                                  {routeCity(selectedRoute)} · {selectedRoute.duracionEstimada} min
                                </span>
                              </span>
                            ) : (
                              "Seleccionar ruta..."
                            )}
                            <ArrowRight className="ml-2 size-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar por IATA, ciudad, país o aeropuerto..." />
                            <CommandList>
                              <CommandEmpty>No hay rutas disponibles.</CommandEmpty>
                              {routeOptions.map((item) => {
                                const origin = airports.find(
                                  (airport) => airport.id === item.aeropuertoOrigenId,
                                );
                                const destination = airports.find(
                                  (airport) => airport.id === item.aeropuertoDestinoId,
                                );
                                const searchValue = [
                                  origin?.codigoIata,
                                  origin?.ciudad,
                                  origin?.pais,
                                  origin?.nombre,
                                  destination?.codigoIata,
                                  destination?.ciudad,
                                  destination?.pais,
                                  destination?.nombre,
                                ]
                                  .filter(Boolean)
                                  .join(" ");
                                return (
                                  <CommandItem
                                    key={item.id}
                                    value={searchValue}
                                    onSelect={() => {
                                      setSelectedRouteId(item.id);
                                      setSelectedGateId(null);
                                      setOpenRouteCombo(false);
                                    }}
                                    className="items-start"
                                  >
                                    <div>
                                      <div className="font-semibold">
                                        {origin?.codigoIata ?? "—"} → {destination?.codigoIata ?? "—"}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {origin?.ciudad ?? "—"} a {destination?.ciudad ?? "—"} · {item.duracionEstimada} min
                                      </div>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </Field>
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
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Seleccionar aeronave
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Filtra por capacidad mínima.
                      </p>
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
                          <Command>
                            <CommandInput placeholder="Buscar matrícula, modelo o aerolínea..." />
                            <CommandList>
                              <CommandEmpty>No hay aeronaves disponibles.</CommandEmpty>
                              {planeOptions.map((item) => {
                                const airline = airlines.find(
                                  (candidate) => candidate.id === item.aerolineaId,
                                );
                                return (
                                  <CommandItem
                                    key={item.id}
                                    value={`${item.matricula} ${item.nombre ?? ""} ${airline?.nombre ?? ""}`}
                                    onSelect={() => {
                                      setSelectedPlaneId(item.id);
                                      setOpenPlaneCombo(false);
                                    }}
                                    className="items-start"
                                  >
                                    <div className="flex w-full items-start justify-between gap-3">
                                      <div>
                                        <div className="font-semibold">
                                          {item.matricula} · {item.nombre ?? "Aeronave"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {airline?.nombre ?? "Aerolínea no disponible"}
                                        </div>
                                      </div>
                                      <Badge variant="secondary">{item.capacidad} pax</Badge>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandList>
                          </Command>
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
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Puerta de embarque y horarios
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Configura el horario operativo del vuelo.
                      </p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Número de vuelo">
                        <Input
                          className="font-mono"
                          value={flightNumber}
                          onChange={(event) =>
                            setFlightNumber(event.target.value.toUpperCase())
                          }
                        />
                      </Field>
                      <Field label="Puerta de embarque">
                        <Popover
                          open={openGateCombo}
                          onOpenChange={setOpenGateCombo}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 w-full justify-between font-normal"
                            >
                              {selectedGate ? (
                                <span className="truncate text-left">
                                  Puerta {selectedGate.numero} · {terminals.find((terminal) => terminal.id === selectedGate.sedeId)?.nombre ?? "Terminal no disponible"}
                                </span>
                              ) : (
                                "Seleccionar puerta..."
                              )}
                              <ArrowRight className="ml-2 size-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Buscar número o terminal..." />
                              <CommandList>
                                <CommandEmpty>
                                  No hay puertas disponibles en el aeropuerto de origen.
                                </CommandEmpty>
                                {validGates.map((gate) => {
                                  const terminal = terminals.find(
                                    (item) => item.id === gate.sedeId,
                                  );
                                  return (
                                    <CommandItem
                                      key={gate.id}
                                      value={`Puerta ${gate.numero} ${terminal?.nombre ?? ""}`}
                                      onSelect={() => {
                                        setSelectedGateId(gate.id);
                                        setOpenGateCombo(false);
                                      }}
                                      className="items-start"
                                    >
                                      <div>
                                        <div className="font-semibold">
                                          Puerta {gate.numero}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {terminal?.nombre ?? "Terminal no disponible"}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </Field>
                      <Field label="Fecha de salida">
                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="date"
                            className="pr-10 font-mono"
                            value={departureDate}
                            onChange={(event) =>
                              setDepartureDate(event.target.value)
                            }
                          />
                        </div>
                      </Field>
                      <Field
                        label="Fecha de llegada"
                        hint="Puede ser el día siguiente si el vuelo cruza medianoche."
                      >
                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="date"
                            className="pr-10 font-mono"
                            value={arrivalDate}
                            min={departureDate}
                            onChange={(event) =>
                              setArrivalDate(event.target.value)
                            }
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
                              onChange={(event) =>
                                setDepartureTime(event.target.value)
                              }
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
                              onChange={(event) =>
                                setArrivalTime(event.target.value)
                              }
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
                    onClick={() =>
                      step === 0 ? navigate("/vuelos") : setStep(step - 1)
                    }
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
                      onClick={() => setStep(step + 1)}
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
                ["Salida", `${departureDate} ${departureTime}`],
                ["Llegada", `${arrivalDate} ${arrivalTime}`],
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
