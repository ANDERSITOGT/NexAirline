import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Check,
  Clock3,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFlights, type Flight } from "@/services/flightService";
import { getReservations, type Reservation } from "@/services/reservationService";
import {
  ejecutarReasignacionIndividual,
  ejecutarReasignacionMasiva,
} from "@/services/reasignacionService";
import { usePreferences } from "@/contexts/usePreferences";
import { formatDateTime } from "@/utils/dateUtils";

type Notice = { kind: "success" | "error"; message: string };
type FlightOption = Flight & { passengers?: number; availableSeats?: number };
type MassiveStep = 1 | 2 | 3;
const massiveSteps = ["Vuelo cancelado", "Vuelos alternativos", "Resumen"];

function flightNumber(flight: Flight) {
  return flight.numeroVuelo || `Vuelo ${flight.id}`;
}

function flightDeparture(flight: Flight) {
  return flight.fechaSalida;
}

function flightLabel(flight: Flight, timezone: string) {
  return `${flightNumber(flight)} · ${formatDateTime(flightDeparture(flight), timezone)}`;
}

function findDetail(reservation: Reservation) {
  return reservation.detalles?.[0] ?? null;
}

function matchesReservation(reservation: Reservation, query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return false;
  const passenger = `${reservation.detalles?.[0]?.nombre_pasajero ?? ""} ${
    reservation.detalles?.[0]?.apellido_pasajero ?? ""
  }`.toLocaleLowerCase();
  const bookingCode = String(
    (reservation as Reservation & { codigo_reserva?: string }).codigo_reserva ?? reservation.id,
  ).toLocaleLowerCase();
  return passenger.includes(normalized) || bookingCode.includes(normalized);
}

function NoticeMessage({ notice }: { notice: Notice }) {
  return (
    <div
      role={notice.kind === "error" ? "alert" : "status"}
      className={`fixed right-6 top-6 z-50 flex max-w-sm items-start gap-3 rounded-lg border p-4 text-sm shadow-lg ${
        notice.kind === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      }`}
    >
      {notice.kind === "error" ? <AlertTriangle className="size-5 shrink-0" /> : <CheckCircle2 className="size-5 shrink-0" />}
      <span>{notice.message}</span>
    </div>
  );
}

function FlightSummary({ flight }: { flight: Flight }) {
  const { timezone } = usePreferences();
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono font-semibold">{flightNumber(flight)}</span>
        <Badge variant={flight.estado === "CANCELADO" ? "destructive" : "secondary"}>{flight.estado}</Badge>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock3 className="size-3.5" /> {formatDateTime(flightDeparture(flight), timezone)}
      </p>
    </div>
  );
}

function CancelledFlightPicker({
  flights,
  value,
  onChange,
}: {
  flights: FlightOption[];
  value: number | null;
  onChange: (flight: FlightOption) => void;
}) {
  const { timezone } = usePreferences();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedFlight = flights.find((flight) => flight.id === value);
  const filteredFlights = flights.filter((flight) =>
    `${flightNumber(flight)} ${flight.rutaId} ${flightDeparture(flight)} ${formatDateTime(flightDeparture(flight), timezone)}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
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
          className="h-11 w-full justify-between text-left font-normal"
        >
          {selectedFlight ? (
            <span className="truncate">
              <span className="font-semibold">{flightNumber(selectedFlight)}</span>
              <span className="ml-2 text-muted-foreground">
                Ruta {selectedFlight.rutaId} · {formatDateTime(flightDeparture(selectedFlight), timezone)}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Buscar por vuelo, ruta o fecha...</span>
          )}
          <Search className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(520px,calc(100vw-3rem))] p-0" align="start">
        <Command>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Buscar por vuelo, ruta o fecha..."
          />
          <CommandList>
            {filteredFlights.length === 0 ? (
              <CommandEmpty>No se encontraron vuelos cancelados.</CommandEmpty>
            ) : filteredFlights.map((flight) => (
              <button
                type="button"
                role="option"
                key={flight.id}
                aria-selected={flight.id === value}
                onClick={() => {
                  onChange(flight);
                  setOpen(false);
                  setSearch("");
                }}
                className="flex w-full cursor-pointer items-center px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <Check className={`mr-2 size-4 shrink-0 ${flight.id === value ? "opacity-100" : "opacity-0"}`} />
                <span className="min-w-0">
                  <span className="block font-semibold">{flightNumber(flight)}</span>
                  <span className="block text-xs text-muted-foreground">Ruta {flight.rutaId} ·                   {formatDateTime(flightDeparture(flight), timezone)}</span>
                </span>
                <Badge className="ml-auto" variant="destructive">CANCELADO</Badge>
              </button>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function ReassignmentsPage() {
  const { timezone } = usePreferences();
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [cancelledFlights, setCancelledFlights] = useState<FlightOption[]>([]);
  const [alternativeFlights, setAlternativeFlights] = useState<FlightOption[]>([]);
  const [massiveStep, setMassiveStep] = useState<MassiveStep>(1);
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<number[]>([]);
  const [alternativesLoading, setAlternativesLoading] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [originId, setOriginId] = useState("");
  const [massiveLoading, setMassiveLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [segments, setSegments] = useState<string[]>([""]);
  const [individualLoading, setIndividualLoading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getFlights(), getFlights({ estado: "CANCELADO" }), getReservations()])
      .then(([flightData, cancelledFlightData, reservationData]) => {
        if (!active) return;
        setFlights(flightData);
        setCancelledFlights(cancelledFlightData);
        setReservations(reservationData);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "No se pudieron cargar los datos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const originFlight = flights.find((flight) => String(flight.id) === originId);
  const selectedDestinationFlights = alternativeFlights.filter((flight) => selectedDestinationIds.includes(flight.id));
  const searchResults = useMemo(
    () => (query.trim() ? reservations.filter((reservation) => matchesReservation(reservation, query)).slice(0, 8) : []),
    [query, reservations],
  );
  const passengerTotal = originFlight
    ? reservations.reduce((count, reservation) => {
        const detail = findDetail(reservation);
        const detailFlightId = detail?.vuelo_asiento?.vuelo?.id ?? detail?.vueloAsiento?.vuelo?.id;
        return count + (detailFlightId === originFlight.id ? 1 : 0);
      }, 0)
    : 0;
  const availableSeats = selectedDestinationFlights.reduce(
    (total, flight) => total + (flight.availableSeats ?? flight.asientosDisponibles ?? flight.capacidad ?? 0),
    0,
  );
  const capacityOk = availableSeats >= passengerTotal;
  const selectedDetail = selectedReservation ? findDetail(selectedReservation) : null;
  const canConfirmIndividual =
    Boolean(selectedDetail) && segments.every(Boolean) && new Set(segments).size === segments.length;

  const showError = (message: string) => setNotice({ kind: "error", message });

  async function submitMassive() {
    if (!originFlight || selectedDestinationIds.length === 0) return;
    if (!capacityOk) {
      showError("El vuelo destino no tiene capacidad suficiente para todos los pasajeros.");
      return;
    }
    setMassiveLoading(true);
    try {
      const response = await ejecutarReasignacionMasiva({
        vuelo_cancelado_id: originFlight.id,
        vuelos_destino_ids: selectedDestinationIds,
      });
      setNotice({ kind: "success", message: response.message ?? "La reasignación masiva se ejecutó correctamente." });
      const [flightData, cancelledFlightData] = await Promise.all([
        getFlights(),
        getFlights({ estado: "CANCELADO" }),
      ]);
      setFlights(flightData);
      setCancelledFlights(cancelledFlightData);
      resetMassiveWizard();
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : "No se pudo ejecutar la reasignación masiva.");
    } finally {
      setMassiveLoading(false);
    }
  }

  async function submitIndividual() {
    if (!selectedDetail || !canConfirmIndividual) return;
    setIndividualLoading(true);
    try {
      const response = await ejecutarReasignacionIndividual({
        detalle_reserva_id: selectedDetail.id,
        vuelos_ids: segments.map(Number),
      });
      setNotice({ kind: "success", message: response.message ?? "El nuevo itinerario fue confirmado correctamente." });
      setSelectedReservation(null);
      setQuery("");
      setSegments([""]);
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : "No se pudo confirmar el nuevo itinerario.");
    } finally {
      setIndividualLoading(false);
    }
  }

  const resetMassiveWizard = () => {
    setMassiveStep(1);
    setOriginId("");
    setAlternativeFlights([]);
    setSelectedDestinationIds([]);
  };

  async function selectCancelledFlight(flight: FlightOption) {
    setOriginId(String(flight.id));
    setSelectedDestinationIds([]);
    setMassiveStep(2);
    setAlternativesLoading(true);
    try {
      const alternatives = await getFlights({ estado: "PROGRAMADO", ruta_id: flight.rutaId });
      setAlternativeFlights(alternatives.filter((item) => item.id !== flight.id));
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : "No se pudieron cargar los vuelos alternativos.");
    } finally {
      setAlternativesLoading(false);
    }
  }

  function toggleDestination(flightId: number, checked: boolean) {
    setSelectedDestinationIds((current) =>
      checked ? [...current, flightId] : current.filter((id) => id !== flightId),
    );
  }

  return (
    <div>
      {notice && <NoticeMessage notice={notice} />}
      <AppBreadcrumb items={[{ label: "Operaciones", href: "/operaciones" }, { label: "Reasignaciones" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reasignaciones por contingencia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reubica pasajeros de vuelos cancelados en una operación masiva o crea itinerarios con escalas.
        </p>
      </div>

      {loadError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {loadError}
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center rounded-xl border bg-card p-12 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Cargando vuelos y reservas...
        </div>
      ) : (
        <Tabs defaultValue="masiva">
          <TabsList className="mb-6 h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger value="masiva" className="rounded-none px-4 py-3">Reubicación de Ruta</TabsTrigger>
            <TabsTrigger value="individual" className="rounded-none px-4 py-3">Individual (Con Escalas)</TabsTrigger>
          </TabsList>

          <TabsContent value="masiva" className="mt-0">
            <ol className="mb-6 flex items-center">
              {massiveSteps.map((label, index) => (
                <li key={label} className={`flex items-center ${index < massiveSteps.length - 1 ? "flex-1" : ""}`}>
                  <button
                    type="button"
                    disabled={index + 1 > massiveStep}
                    onClick={() => setMassiveStep((index + 1) as MassiveStep)}
                    className="flex items-center gap-2.5 disabled:cursor-default"
                  >
                    <span className={`flex size-8 items-center justify-center rounded-full font-mono text-sm font-medium ${index + 1 < massiveStep ? "bg-primary text-white" : index + 1 === massiveStep ? "bg-primary text-white" : "border border-border bg-card text-muted-foreground"}`}>
                      {index + 1 < massiveStep ? <Check className="size-4" /> : index + 1}
                    </span>
                    <span className={`hidden text-sm sm:block ${index + 1 === massiveStep ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
                  </button>
                  {index < massiveSteps.length - 1 && <span className={`mx-3 h-px flex-1 ${index + 1 < massiveStep ? "bg-primary" : "bg-border"}`} />}
                </li>
              ))}
            </ol>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:hidden">
              Paso {massiveStep} de 3 · {massiveSteps[massiveStep - 1]}
            </p>
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <Card className="rounded-xl">
                <CardContent className="p-5 md:p-7">
                  {massiveStep === 1 && (
                    <div className="space-y-5">
                      <div><h2 className="text-lg font-semibold">Seleccionar vuelo cancelado</h2><p className="text-sm text-muted-foreground">Busca por número, ruta o fecha para comenzar la reubicación.</p></div>
                      <CancelledFlightPicker flights={cancelledFlights} value={originFlight?.id ?? null} onChange={(flight) => void selectCancelledFlight(flight)} />
                      <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">Selecciona un vuelo para consultar sus alternativas de la misma ruta.</div>
                    </div>
                  )}
                  {massiveStep === 2 && (
                    <div className="space-y-5">
                      <div><h2 className="text-lg font-semibold">Seleccionar vuelos alternativos</h2><p className="text-sm text-muted-foreground">Selecciona uno o más vuelos programados para cubrir la necesidad.</p></div>
                      {alternativesLoading ? <div className="flex items-center justify-center p-8 text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" /> Cargando vuelos alternativos...</div> : alternativeFlights.map((flight) => (
                        <label key={flight.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-muted/50">
                          <Checkbox checked={selectedDestinationIds.includes(flight.id)} onCheckedChange={(checked) => toggleDestination(flight.id, checked === true)} />
                          <span className="flex-1"><span className="block font-mono font-semibold">{flightNumber(flight)}</span><span className="text-xs text-muted-foreground">{formatDateTime(flightDeparture(flight), timezone)} · Ruta {flight.rutaId}</span></span>
                          <span className="text-right text-sm"><span className="block font-medium">{flight.availableSeats ?? flight.asientosDisponibles ?? flight.capacidad ?? 0}</span><span className="text-xs text-muted-foreground">asientos</span></span>
                        </label>
                      ))}
                      {!alternativesLoading && alternativeFlights.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No hay vuelos programados para esta ruta.</p>}
                    </div>
                  )}
                  {massiveStep === 3 && (
                    <div className="space-y-5">
                      <div><h2 className="text-lg font-semibold">Confirmar reubicación</h2><p className="text-sm text-muted-foreground">Revisa la distribución antes de ejecutar la operación.</p></div>
                      <div className="rounded-lg bg-background p-5"><p className="text-sm">Se reubicarán <strong>{passengerTotal} pasajeros</strong> en los vuelos <strong>{selectedDestinationFlights.map(flightNumber).join(", ")}</strong>.</p></div>
                    </div>
                  )}
                  <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                    <Button variant="ghost" onClick={() => {
                      if (massiveStep === 1) { resetMassiveWizard(); return; }
                      if (massiveStep === 3) setMassiveStep(2);
                      else resetMassiveWizard();
                    }}>
                      {massiveStep === 1 ? "Cancelar" : <><ArrowLeft className="size-4" /> Atrás</>}
                    </Button>
                    {massiveStep < 3 ? (
                      <Button disabled={massiveStep === 1 ? !originFlight || alternativesLoading : selectedDestinationIds.length === 0 || !capacityOk} onClick={() => setMassiveStep((massiveStep + 1) as MassiveStep)}>
                        Continuar <ArrowRight className="size-4" />
                      </Button>
                    ) : (
                      <Button disabled={massiveLoading} onClick={() => void submitMassive()}>
                        {massiveLoading && <Loader2 className="size-4 animate-spin" />} Confirmar y ejecutar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="h-fit rounded-xl lg:sticky lg:top-6">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resumen</p>
                  <div className="mt-4 space-y-4">
                    <div><p className="text-xs text-muted-foreground">Vuelo original</p>{originFlight ? <FlightSummary flight={originFlight} /> : <p className="mt-1 text-sm text-muted-foreground">Aún no seleccionado</p>}</div>
                    <div className="flex items-center justify-between border-t pt-4 text-sm"><span className="text-muted-foreground">Pasajeros a reubicar</span><strong>{passengerTotal}</strong></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Capacidad cubierta</span><strong className={capacityOk && selectedDestinationIds.length ? "text-emerald-600" : "text-muted-foreground"}>{availableSeats}</strong></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="individual" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Reasignación individual y multi-escala</CardTitle>
                <CardDescription>Busca por código de reserva o nombre del pasajero y construye el nuevo itinerario.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Código de reserva o nombre del pasajero" aria-label="Buscar reserva" />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                      {searchResults.map((reservation) => {
                        const detail = findDetail(reservation);
                        return <button type="button" className="block w-full border-b px-4 py-3 text-left text-sm last:border-0 hover:bg-muted" key={reservation.id} onClick={() => { setSelectedReservation(reservation); setQuery(""); setSegments([""]); }}>
                          <span className="font-medium">{detail ? `${detail.nombre_pasajero} ${detail.apellido_pasajero ?? ""}` : "Pasajero sin detalle"}</span>
                          <span className="ml-2 text-muted-foreground">Reserva #{reservation.id}</span>
                        </button>;
                      })}
                    </div>
                  )}
                </div>
                {selectedReservation && selectedDetail ? (
                  <div className="grid gap-5">
                    <div>
                      <p className="mb-2 text-sm font-medium">Itinerario actual</p>
                      {(() => {
                        const currentFlightId = selectedDetail.vuelo_asiento?.vuelo?.id ?? selectedDetail.vueloAsiento?.vuelo?.id;
                        const currentFlight = flights.find((flight) => flight.id === currentFlightId);
                        return currentFlight ? (
                          <FlightSummary flight={currentFlight} />
                        ) : (
                          <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
                            {selectedDetail.numero_vuelo ?? selectedDetail.numeroVuelo ?? "Vuelo actual no disponible"}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <div><p className="text-sm font-medium">Carrito de tramos</p><p className="text-xs text-muted-foreground">Selecciona vuelos sucesivos para el nuevo itinerario.</p></div>
                        <Button variant="outline" size="sm" onClick={() => setSegments((current) => [...current, ""])}><Plus className="size-4" /> Añadir conexión</Button>
                      </div>
                      {segments.map((segment, index) => (
                        <div className="flex items-center gap-2" key={`${index}-${segment}`}>
                          <span className="w-6 text-center text-sm font-medium text-muted-foreground">{index + 1}</span>
                          <Select value={segment} onValueChange={(value) => setSegments((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))}>
                            <SelectTrigger aria-label={`Vuelo del tramo ${index + 1}`}><SelectValue placeholder={`Selecciona el vuelo ${index === 0 ? "A" : String.fromCharCode(65 + index)}`} /></SelectTrigger>
                            <SelectContent>{flights.filter((flight) => flight.estado !== "CANCELADO" && flight.estado !== "FINALIZADO").map((flight) => <SelectItem key={flight.id} value={String(flight.id)}>{flightLabel(flight, timezone)}</SelectItem>)}</SelectContent>
                          </Select>
                          {segments.length > 1 && <Button aria-label={`Eliminar tramo ${index + 1}`} size="icon" variant="ghost" onClick={() => setSegments((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4 text-muted-foreground" /></Button>}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button disabled={!canConfirmIndividual || individualLoading} onClick={() => void submitIndividual()}>
                        {individualLoading && <Loader2 className="size-4 animate-spin" />}
                        Confirmar Nuevo Itinerario
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Busca una reserva para ver su itinerario actual.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
