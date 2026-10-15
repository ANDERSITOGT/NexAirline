import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, PlaneTakeoff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { airportById, flights, fmtDuration, gates, planeById, planes, routes, type Flight } from "../data1";

const steps = ["Ruta", "Aeronave", "Puerta y horarios"];
const capacityFilters = [0, 150, 180, 250];
const inputClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

type Option = { value: number; label: string; sub?: string; meta?: string };

function addMinutes(date: string, time: string, minutes: number) {
  const current = new Date(`${date}T${time}`);
  current.setMinutes(current.getMinutes() + minutes);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`,
    time: `${pad(current.getHours())}:${pad(current.getMinutes())}`,
  };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium"><span>{label}</span>{children}{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</label>;
}

function DataSelect({ options, value, onChange, placeholder }: { options: Option[]; value: number | null; onChange: (value: number | null) => void; placeholder: string }) {
  return <select className={inputClass} value={value ?? ""} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}{option.sub ? ` · ${option.sub}` : ""}{option.meta ? ` · ${option.meta}` : ""}</option>)}</select>;
}

function WizardBadge({ value }: { value: string }) {
  return <Badge variant={value === "Operativa" ? "secondary" : "default"}>{value}</Badge>;
}

export default function Wizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [routeId, setRouteId] = useState<number | null>(null);
  const [planeId, setPlaneId] = useState<number | null>(null);
  const [minimumCapacity, setMinimumCapacity] = useState(0);
  const [flightNumber, setFlightNumber] = useState("AX 812");
  const [gateIndex, setGateIndex] = useState<number | null>(null);
  const [departureDate, setDepartureDate] = useState("2026-10-17");
  const [departureTime, setDepartureTime] = useState("09:30");
  const [manualArrival, setManualArrival] = useState("");

  const route = routes.find((item) => item.id === routeId);
  const plane = planeId ? planeById(planeId) : null;
  const automaticArrival = route ? addMinutes(departureDate, departureTime, route.duracion) : null;
  const arrivalTime = manualArrival || automaticArrival?.time || "";
  const arrivalDate = manualArrival ? departureDate : automaticArrival?.date ?? departureDate;
  const timesValid = !!arrivalTime && `${arrivalDate}T${arrivalTime}` > `${departureDate}T${departureTime}`;

  const routeOptions = useMemo(() => routes.filter((item) => item.activa).map((item) => ({
    value: item.id,
    label: `${airportById(item.origen).iata} → ${airportById(item.destino).iata}`,
    sub: `${airportById(item.origen).ciudad} – ${airportById(item.destino).ciudad}`,
    meta: fmtDuration(item.duracion),
  })), []);
  const planeOptions = planes.filter((item) => item.capacidad >= minimumCapacity).map((item) => ({ value: item.id, label: item.matricula, sub: item.modelo, meta: `${item.capacidad} asientos` }));
  const gateOptions = gates.map((gate, index) => ({ value: index + 1, label: `Puerta ${gate}`, sub: `Terminal ${gate[0]}` }));
  const canContinue = step === 0 ? !!routeId : step === 1 ? !!planeId && plane?.estado === "Operativa" : !!gateIndex && timesValid && !!flightNumber.trim();

  const submit = () => {
    if (!routeId || !planeId || !gateIndex || !arrivalTime) return;
    const newFlight: Flight = {
      id: Date.now(), numero: flightNumber.trim(), ruta: routeId, avion: planeId,
      salida: `${departureDate}T${departureTime}`, llegada: `${arrivalDate}T${arrivalTime}`,
      puerta: gates[gateIndex - 1], estado: "PROGRAMADO",
    };
    flights.push(newFlight);
    navigate("/vuelos");
  };

  return <div>
    <button onClick={() => navigate("/vuelos")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Volver a vuelos</button>
    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Programar vuelo</h1>
    <p className="mt-1 text-sm text-muted-foreground">Cada paso valida la integridad con Ruta, Avión y Puerta_embarque.</p>

    <ol className="mt-6 flex items-center">{steps.map((label, index) => <li key={label} className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}><button disabled={index > step} onClick={() => setStep(index)} className="flex items-center gap-2.5 disabled:cursor-default"><span className={`flex size-8 items-center justify-center rounded-full font-mono text-sm font-medium transition-colors ${index < step ? "bg-ok text-white" : index === step ? "bg-primary text-white" : "border border-border bg-card text-muted-foreground"}`}>{index < step ? <Check className="size-4" /> : index + 1}</span><span className={`hidden text-sm sm:block ${index === step ? "font-semibold" : "text-muted-foreground"}`}>{label}</span></button>{index < steps.length - 1 && <span className={`mx-3 h-px flex-1 ${index < step ? "bg-ok" : "bg-border"}`} />}</li>)}</ol>
    <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:hidden">Paso {step + 1} de 3 · {steps[step]}</p>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="rounded-xl"><CardContent className="p-5 md:p-7">
        {step === 0 && <div className="anim-up space-y-5"><div><h2 className="text-lg font-semibold">Seleccionar ruta</h2><p className="text-sm text-muted-foreground">Solo se muestran rutas activas (Ruta.activa = true).</p></div><Field label="Ruta (origen → destino)"><DataSelect options={routeOptions} value={routeId} onChange={setRouteId} placeholder="Buscar por código IATA o ciudad…" /></Field>{route && <div className="anim-up grid grid-cols-3 gap-3 rounded-lg bg-background p-4">{[["Origen", airportById(route.origen).nombre], ["Destino", airportById(route.destino).nombre], ["Duración est.", fmtDuration(route.duracion)]].map(([label, value]) => <div key={label} className="min-w-0"><div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 text-sm font-medium leading-snug">{value}</div></div>)}<div className="col-span-3 border-t border-border pt-3 font-mono text-xs text-muted-foreground">Distancia {route.distancia.toLocaleString("es-GT")} km</div></div>}</div>}

        {step === 1 && <div className="anim-up space-y-5"><div><h2 className="text-lg font-semibold">Seleccionar aeronave</h2><p className="text-sm text-muted-foreground">Filtra por capacidad mínima de pasajeros.</p></div><div><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Capacidad mínima</span><div className="flex flex-wrap gap-2">{capacityFilters.map((capacity) => <button key={capacity} onClick={() => { setMinimumCapacity(capacity); setPlaneId(null); }} className={`h-8 rounded-full border px-3.5 font-mono text-xs transition-colors ${minimumCapacity === capacity ? "border-primary bg-primary text-white" : "border-border hover:bg-muted"}`}>{capacity === 0 ? "Todas" : `${capacity}+`}</button>)}</div></div><Field label="Avión" hint={`${planeOptions.length} aeronaves cumplen el filtro`}><DataSelect options={planeOptions} value={planeId} onChange={setPlaneId} placeholder="Buscar matrícula o modelo…" /></Field>{plane && <div className={`anim-up flex flex-wrap items-center justify-between gap-3 rounded-lg p-4 ${plane.estado === "Operativa" ? "bg-background" : "bg-warn-bg"}`}><div><div className="font-medium">{plane.modelo}</div><div className="font-mono text-xs text-muted-foreground">{plane.matricula} · {plane.capacidad} asientos</div></div><WizardBadge value={plane.estado} />{plane.estado !== "Operativa" && <p className="w-full text-sm text-warn">Esta aeronave está en mantenimiento y no puede asignarse. Elige otra.</p>}</div>}</div>}

        {step === 2 && <div className="anim-up space-y-5"><div><h2 className="text-lg font-semibold">Puerta de embarque y horarios</h2><p className="text-sm text-muted-foreground">La llegada se calcula con la duración estimada de la ruta.</p></div><div className="grid gap-5 sm:grid-cols-2"><Field label="Número de vuelo"><Input className="font-mono" value={flightNumber} onChange={(event) => setFlightNumber(event.target.value)} /></Field><Field label="Puerta de embarque"><DataSelect options={gateOptions} value={gateIndex} onChange={setGateIndex} placeholder="Buscar puerta…" /></Field><Field label="Fecha de salida"><div className="relative"><CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input type="date" className="pr-10 font-mono" value={departureDate} min="2026-10-15" onChange={(event) => setDepartureDate(event.target.value)} /></div></Field><div className="grid grid-cols-2 gap-3"><Field label="Hora salida"><div className="relative"><Clock className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input type="time" className="pr-10 font-mono" value={departureTime} onChange={(event) => { setDepartureTime(event.target.value); setManualArrival(""); }} /></div></Field><Field label="Hora llegada"><div className="relative"><Clock className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input type="time" className="pr-10 font-mono" value={arrivalTime} onChange={(event) => setManualArrival(event.target.value)} /></div></Field></div></div>{!timesValid && <p className="text-sm text-destructive">La llegada debe ser posterior a la salida.</p>}</div>}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-5"><Button variant="ghost" onClick={() => step === 0 ? navigate("/vuelos") : setStep(step - 1)}>{step === 0 ? "Cancelar" : <><ArrowLeft className="size-4" /> Atrás</>}</Button>{step < 2 ? <Button disabled={!canContinue} onClick={() => setStep(step + 1)}>Continuar <ArrowRight className="size-4" /></Button> : <Button disabled={!canContinue} onClick={submit}><PlaneTakeoff className="size-4" /> Programar vuelo</Button>}</div>
      </CardContent></Card>

      <Card className="h-fit rounded-xl lg:sticky lg:top-0"><CardContent className="p-5"><h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resumen</h3><dl className="mt-4 space-y-4 text-sm">{[["Vuelo", flightNumber || "—"], ["Ruta", route ? `${airportById(route.origen).iata} → ${airportById(route.destino).iata}` : "Pendiente"], ["Aeronave", plane ? `${plane.matricula} · ${plane.capacidad} pax` : "Pendiente"], ["Puerta", gateIndex ? gates[gateIndex - 1] : "Pendiente"], ["Salida", `${departureDate} ${departureTime}`], ["Llegada", arrivalTime ? `${arrivalDate} ${arrivalTime}` : "Pendiente"]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"><dt className="text-muted-foreground">{label}</dt><dd className={`font-mono ${value === "Pendiente" ? "text-muted-foreground/60" : "font-medium"}`}>{value}</dd></div>)}</dl></CardContent></Card>
    </div>
  </div>;
}
