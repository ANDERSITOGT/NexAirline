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
import { Input } from "@/components/ui/input";
import { getAirports, type Airport } from "../services/airportService";
import { getPlanes, type Plane } from "../services/planeService";
import { getRoutes, type Route } from "../services/routeService";
import { getGates, type Gate } from "../services/gateService";
import { createFlight, type CreateFlightDTO } from "../services/flightService";

const steps = ["Ruta", "Aeronave", "Puerta y horarios"];
const capacityFilters = [0, 150, 180, 250];
const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
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
  const [airports, setAirports] = useState<Airport[]>([]);
  const [routeId, setRouteId] = useState<number | null>(null);
  const [planeId, setPlaneId] = useState<number | null>(null);
  const [minimumCapacity, setMinimumCapacity] = useState(0);
  const [flightNumber, setFlightNumber] = useState("AX 812");
  const [gateId, setGateId] = useState<number | null>(null);
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
        const [loadedRoutes, loadedPlanes, loadedGates, loadedAirports] =
          await Promise.all([
            getRoutes(),
            getPlanes(),
            getGates(),
            getAirports(),
          ]);
        setRoutes(loadedRoutes);
        setPlanes(loadedPlanes);
        setGates(loadedGates);
        setAirports(loadedAirports);
      } catch {
        setNotice("No se pudieron cargar los catálogos");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);
  const route = routes.find((item) => item.id === routeId);
  const plane = planes.find((item) => item.id === planeId);
  const routeLabel = (item: Route) =>
    `${airports.find((airport) => airport.id === item.aeropuertoOrigenId)?.codigoIata ?? "—"} → ${airports.find((airport) => airport.id === item.aeropuertoDestinoId)?.codigoIata ?? "—"}`;
  const routeCity = (item: Route) =>
    `${airports.find((airport) => airport.id === item.aeropuertoOrigenId)?.ciudad ?? "—"} – ${airports.find((airport) => airport.id === item.aeropuertoDestinoId)?.ciudad ?? "—"}`;
  const routeOptions = routes.filter((item) => item.activa);
  const planeOptions = planes.filter(
    (item) => item.activo && item.capacidad >= minimumCapacity,
  );
  const timesValid =
    `${arrivalDate}T${arrivalTime}` > `${departureDate}T${departureTime}`;
  const canContinue =
    step === 0
      ? !!routeId
      : step === 1
        ? !!planeId
        : !!gateId && timesValid && !!flightNumber.trim();
  const submit = async () => {
    if (!route || !plane || !gateId || !timesValid) return;
    const payload: CreateFlightDTO = {
      aerolineaId: plane.aerolineaId,
      avionId: plane.id,
      rutaId: route.id,
      puertaEmbarqueId: gateId,
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
                      <select
                        className={inputClass}
                        value={routeId ?? ""}
                        onChange={(event) =>
                          setRouteId(
                            event.target.value
                              ? Number(event.target.value)
                              : null,
                          )
                        }
                      >
                        <option value="">
                          Buscar por código IATA o ciudad…
                        </option>
                        {routeOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {routeLabel(item)} · {routeCity(item)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {route && (
                      <div className="grid grid-cols-3 gap-3 rounded-lg bg-background p-4">
                        {[
                          [
                            "Origen",
                            airports.find(
                              (airport) =>
                                airport.id === route.aeropuertoOrigenId,
                            )?.nombre ?? "—",
                          ],
                          [
                            "Destino",
                            airports.find(
                              (airport) =>
                                airport.id === route.aeropuertoDestinoId,
                            )?.nombre ?? "—",
                          ],
                          ["Duración est.", `${route.duracionEstimada} min`],
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
                            setPlaneId(null);
                          }}
                          className={`h-8 rounded-full border px-3.5 font-mono text-xs ${minimumCapacity === capacity ? "border-primary bg-primary text-white" : "border-border hover:bg-muted"}`}
                        >
                          {capacity === 0 ? "Todas" : `${capacity}+`}
                        </button>
                      ))}
                    </div>
                    <Field label="Avión">
                      <select
                        className={inputClass}
                        value={planeId ?? ""}
                        onChange={(event) =>
                          setPlaneId(
                            event.target.value
                              ? Number(event.target.value)
                              : null,
                          )
                        }
                      >
                        <option value="">Buscar matrícula o modelo…</option>
                        {planeOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.matricula} · {item.nombre ?? ""} ·{" "}
                            {item.capacidad} asientos
                          </option>
                        ))}
                      </select>
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
                        <select
                          className={inputClass}
                          value={gateId ?? ""}
                          onChange={(event) =>
                            setGateId(
                              event.target.value
                                ? Number(event.target.value)
                                : null,
                            )
                          }
                        >
                          <option value="">Buscar puerta…</option>
                          {gates
                            .filter((gate) => gate.activo)
                            .map((gate) => (
                              <option key={gate.id} value={gate.id}>
                                {gate.numero}
                              </option>
                            ))}
                        </select>
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
                      <Field label="Fecha de llegada" hint="Puede ser el día siguiente si el vuelo cruza medianoche.">
                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="date"
                            className="pr-10 font-mono"
                            value={arrivalDate}
                            min={departureDate}
                            onChange={(event) => setArrivalDate(event.target.value)}
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
                ["Ruta", route ? routeLabel(route) : "Pendiente"],
                [
                  "Aeronave",
                  plane
                    ? `${plane.matricula} · ${plane.capacidad} pax`
                    : "Pendiente",
                ],
                [
                  "Puerta",
                  gateId
                    ? (gates.find((gate) => gate.id === gateId)?.numero ??
                      "Pendiente")
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
