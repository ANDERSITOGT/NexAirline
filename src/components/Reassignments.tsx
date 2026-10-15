import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { flights, fmtDate, fmtTime, planeById, routeLabel, type Flight } from "../data1";
import { usuarios } from "../data2";
import { reasignacionesSeed, type Reasignacion } from "../data3";

const reasons = ["Cancelación por condiciones meteorológicas", "Cambio de aeronave por mantenimiento", "Consolidación por baja ocupación", "Falla operativa en tierra", "Otro"];
const inputClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const passengerCount = (id: number) => 40 + ((id * 2654435761) >>> 0) % 100;

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium"><span>{label}</span>{children}{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</label>;
}

function FlightBadge({ value }: { value: string }) {
  return <Badge variant={value === "CANCELADO" ? "destructive" : value === "FINALIZADO" ? "secondary" : "default"}>{value}</Badge>;
}

function FlightSelect({ options, value, onChange, placeholder }: { options: Array<{ value: number; label: string; sub: string; meta: string }>; value: number | null; onChange: (value: number | null) => void; placeholder: string }) {
  return <select className={inputClass} value={value ?? ""} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label} · {option.sub} · {option.meta}</option>)}</select>;
}

export default function Reassignments() {
  const [list, setList] = useState(reasignacionesSeed);
  const [open, setOpen] = useState(false);
  const [originalId, setOriginalId] = useState<number | null>(null);
  const [destinationId, setDestinationId] = useState<number | null>(null);
  const [reason, setReason] = useState(reasons[0]);
  const [extraReason, setExtraReason] = useState("");
  const flight = (id: number) => flights.find((item) => item.id === id);
  const label = (item: Flight) => ({ value: item.id, label: item.numero, sub: `${routeLabel(item.ruta)} · ${planeById(item.avion).matricula}`, meta: `${fmtDate(item.salida)} ${fmtTime(item.salida)}` });
  const originalOptions = flights.filter((item) => item.estado !== "FINALIZADO").map(label);
  const originalFlight = originalId ? flight(originalId) : undefined;
  const destinationOptions = flights.filter((item) => originalFlight && item.id !== originalFlight.id && item.ruta === originalFlight.ruta && (item.estado === "PROGRAMADO" || item.estado === "ABORDANDO")).map(label);
  const destinationFlight = destinationId ? flight(destinationId) : undefined;
  const passengers = originalFlight ? passengerCount(originalFlight.id) : 0;
  const freeSeats = destinationFlight ? planeById(destinationFlight.avion).capacidad - passengerCount(destinationFlight.id) : 0;
  const fits = !destinationFlight || freeSeats >= passengers;
  const close = () => { setOpen(false); setOriginalId(null); setDestinationId(null); setExtraReason(""); };
  const save = () => {
    if (!originalId || !destinationId || !destinationFlight || !fits || (reason === "Otro" && !extraReason.trim())) return;
    const item: Reasignacion = { id: Date.now(), original: originalId, nuevo: destinationId, fecha: "2026-10-15T13:45", motivo: reason === "Otro" ? extraReason.trim() : reason, usuario: 1, pasajeros: passengers };
    setList((current) => [item, ...current]);
    close();
  };

  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reasignaciones</h1><p className="mt-1 text-sm text-muted-foreground">Traslado de pasajeros entre vuelos de la misma ruta, con motivo y responsable.</p></div><Button onClick={() => setOpen(true)}><Plus className="size-4" /> Nueva reasignación</Button></div>

    <Card className="overflow-hidden rounded-xl"><CardContent className="p-0"><Table><TableHeader><TableRow>{["Fecha", "Vuelo original", "", "Vuelo nuevo", "Pasajeros", "Motivo", "Responsable"].map((heading) => <TableHead key={heading}>{heading}</TableHead>)}</TableRow></TableHeader><TableBody>{list.map((item) => { const original = flight(item.original); const destination = flight(item.nuevo); return <TableRow key={item.id}><TableCell className="font-mono text-xs">{item.fecha.replace("T", " ")}</TableCell><TableCell><span className="font-mono font-medium">{original?.numero}</span>{original && <span className="ml-2"><FlightBadge value={original.estado} /></span>}</TableCell><TableCell><ArrowRight className="size-4 text-muted-foreground" /></TableCell><TableCell className="font-mono font-medium">{destination?.numero} <span className="text-muted-foreground">{destination && routeLabel(destination.ruta)}</span></TableCell><TableCell className="font-mono">{item.pasajeros}</TableCell><TableCell>{item.motivo}</TableCell><TableCell className="text-muted-foreground">{usuarios.find((user) => user.id === item.usuario)?.nombre}</TableCell></TableRow>; })}</TableBody></Table></CardContent></Card>

    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : close()}><DialogContent><DialogHeader><DialogTitle>Nueva reasignación</DialogTitle><DialogDescription>Tabla Reasignacion · vuelo_original ≠ vuelo_nuevo</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><Field label="Vuelo original"><FlightSelect options={originalOptions} value={originalId} onChange={(value) => { setOriginalId(value); setDestinationId(null); }} placeholder="Buscar vuelo…" /></Field><Field label="Vuelo nuevo" hint={originalFlight ? "Solo vuelos programados de la misma ruta." : "Elige primero el vuelo original."}><FlightSelect options={destinationOptions} value={destinationId} onChange={setDestinationId} placeholder={originalFlight && destinationOptions.length === 0 ? "Sin vuelos alternativos" : "Buscar vuelo…"} /></Field>{originalFlight && destinationFlight && <div className="anim-up grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm"><div className="bg-background p-3"><div className="text-xs text-muted-foreground">Pasajeros a mover</div><div className="font-mono text-xl">{passengers}</div></div><div className="bg-background p-3"><div className="text-xs text-muted-foreground">Asientos libres en {destinationFlight.numero}</div><div className={`font-mono text-xl ${fits ? "" : "text-destructive"}`}>{freeSeats}</div></div></div>}{!fits && <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" /> El vuelo nuevo no tiene capacidad suficiente.</p>}<Field label="Motivo"><select className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map((item) => <option key={item}>{item}</option>)}</select></Field>{reason === "Otro" && <Field label="Detalle del motivo"><Input value={extraReason} onChange={(event) => setExtraReason(event.target.value)} /></Field>}</div><DialogFooter><Button variant="outline" onClick={close}>Cancelar</Button><Button disabled={!originalId || !destinationId || !fits || (reason === "Otro" && !extraReason.trim())} onClick={save}>Reasignar pasajeros</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
