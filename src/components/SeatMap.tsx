import { useState } from "react";
import { Lock, LockOpen, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { bitacora, tiposAsiento } from "../data3";
import { flights, fmtDate, fmtTime, planeById, routeLabel, routes, type Flight } from "../data1";
import { reservas } from "../data2";

type SeatEstado = "DISPONIBLE" | "RESERVADO_TEMPORAL" | "CONFIRMADO" | "BLOQUEADO" | "CHECKED_IN";
interface Seat { id: string; fila: number; letra: string; tipo: string; estado: SeatEstado; precio: number }

const LEFT = ["A", "B", "C"];
const RIGHT = ["D", "E", "F"];
const seatStyle: Record<SeatEstado, string> = {
  DISPONIBLE: "border-ok/40 bg-ok-bg text-ok hover:border-ok",
  RESERVADO_TEMPORAL: "border-transparent bg-warn-bg text-warn",
  CONFIRMADO: "border-transparent bg-primary text-white",
  CHECKED_IN: "border-transparent bg-[#4b5b72] text-white",
  BLOQUEADO: "border-bad/30 bg-bad-bg text-bad hover:border-bad",
};
const legend: [SeatEstado, string][] = [
  ["DISPONIBLE", "Disponible"], ["RESERVADO_TEMPORAL", "Reserva temporal"], ["CONFIRMADO", "Confirmado"], ["CHECKED_IN", "Check-in"], ["BLOQUEADO", "Bloqueado"],
];

const hash = (value: string) => { let result = 7; for (const character of value) result = (result * 31 + character.charCodeAt(0)) >>> 0; return result; };

function buildSeats(flight: Flight): Seat[] {
  const capacity = planeById(flight.avion).capacidad;
  const route = routes.find((item) => item.id === flight.ruta)!;
  const priceFactor = 0.6 + route.distancia / 2500;
  const reserved = new Map(reservas.flatMap((reservation) => reservation.pax.filter((passenger) => passenger.vuelo === flight.numero).map((passenger) => [passenger.asiento, passenger.checkedIn ? "CHECKED_IN" : "CONFIRMADO"] as const)));
  const history = new Map(bitacora.filter((entry) => entry.vuelo === flight.numero).map((entry) => [entry.asiento, entry.nuevo as SeatEstado]));
  const seats: Seat[] = [];
  for (let fila = 1; seats.length < capacity; fila += 1) {
    for (const letra of [...LEFT, ...RIGHT]) {
      if (seats.length >= capacity) break;
      const id = `${fila}${letra}`;
      const tipo = fila <= 3 ? tiposAsiento[0].nombre : fila === 12 || fila === 13 ? tiposAsiento[2].nombre : tiposAsiento[1].nombre;
      const basePrice = tipo === "Premium" ? 320 : tipo === "Económico" ? 140 : 165;
      const random = hash(`${flight.id}${id}`) % 100;
      const generated: SeatEstado = flight.estado === "PROGRAMADO"
        ? random < 38 ? "CONFIRMADO" : random < 46 ? "RESERVADO_TEMPORAL" : random < 49 ? "BLOQUEADO" : "DISPONIBLE"
        : random < 70 ? "CHECKED_IN" : random < 78 ? "CONFIRMADO" : random < 80 ? "BLOQUEADO" : "DISPONIBLE";
      seats.push({ id, fila, letra, tipo, estado: history.get(id) ?? reserved.get(id) ?? generated, precio: Math.round((basePrice * priceFactor) / 5) * 5 });
    }
  }
  return seats;
}

export default function SeatMap() {
  const options = flights.filter((flight) => flight.estado !== "CANCELADO" && flight.estado !== "FINALIZADO");
  const [flightId, setFlightId] = useState(options[0]?.id ?? 0);
  const [edits, setEdits] = useState<Record<string, Partial<Seat>>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const flight = flights.find((item) => item.id === flightId) ?? options[0];
  const plane = planeById(flight.avion);
  const seats = buildSeats(flight).map((seat) => ({ ...seat, ...edits[`${flightId}:${seat.id}`] }));
  const rows = Array.from(new Set(seats.map((seat) => seat.fila)));
  const byId = Object.fromEntries(seats.map((seat) => [seat.id, seat]));
  const counts = seats.reduce<Record<string, number>>((result, seat) => ({ ...result, [seat.estado]: (result[seat.estado] ?? 0) + 1 }), {});
  const selected = selectedIds.map((id) => byId[id]).filter(Boolean);
  const editable = (seat: Seat) => seat.estado === "DISPONIBLE" || seat.estado === "BLOQUEADO";
  const patch = (ids: string[], values: Partial<Seat>, message: string) => {
    const next = { ...edits };
    ids.forEach((id) => { next[`${flightId}:${id}`] = { ...next[`${flightId}:${id}`], ...values }; });
    setEdits(next);
    setLog([`${message} · ${ids.length > 3 ? `${ids.length} asientos` : ids.join(", ")}`, ...log].slice(0, 3));
    setSelectedIds([]);
  };

  return <TooltipProvider>
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mapa de asientos</h1><p className="mt-1 text-sm text-muted-foreground">Inventario por vuelo. Selecciona plazas para bloquearlas o cambiar su precio.</p></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="min-w-0 rounded-xl"><CardHeader><div className="grid gap-4 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-end"><label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vuelo<select className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground" value={flightId} onChange={(event) => { setFlightId(Number(event.target.value)); setSelectedIds([]); }}>{options.map((item) => <option key={item.id} value={item.id}>{item.numero} · {routeLabel(item.ruta)} · {planeById(item.avion).matricula} · {fmtDate(item.salida)} {fmtTime(item.salida)}</option>)}</select></label><div className="font-mono text-xs text-muted-foreground sm:text-right">{plane.modelo} · {plane.matricula} · {plane.capacidad} asientos</div></div><CardDescription className="flex flex-wrap gap-x-4 gap-y-2 text-xs">{legend.map(([key, label]) => <span key={key} className="flex items-center gap-1.5"><Badge variant="outline" className={`size-3.5 rounded-sm p-0 ${seatStyle[key].split(" ").slice(0, 2).join(" ")}`} />{label} <span className="font-mono">{counts[key] ?? 0}</span></span>)}</CardDescription></CardHeader>
          <CardContent><div className="flex justify-center rounded-lg bg-background px-2 py-6"><div className="w-full max-w-[420px]"><div className="mx-auto h-14 w-[70%] rounded-t-full border-x-2 border-t-2 border-border bg-card text-center font-mono text-[10px] uppercase tracking-widest leading-[3.5rem] text-muted-foreground">Cabina</div><div className="max-h-[560px] overflow-y-auto border-x-2 border-border bg-card px-3 py-3 sm:px-6"><div className="mb-2 grid grid-cols-[1fr_28px_1fr] text-center font-mono text-[11px] text-muted-foreground"><div className="grid grid-cols-3">{LEFT.map((letter) => <span key={letter}>{letter}</span>)}</div><span /><div className="grid grid-cols-3">{RIGHT.map((letter) => <span key={letter}>{letter}</span>)}</div></div>{rows.map((fila) => <div key={fila}>{(fila === 1 || fila === 4) && <div className="my-2 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{fila === 1 ? "Premium" : "Económico"}</div>}<div className={`grid grid-cols-[1fr_28px_1fr] items-center py-[3px] ${fila === 12 || fila === 13 ? "bg-warn-bg/50" : ""}`}>{[LEFT, RIGHT].map((group, groupIndex) => <div key={groupIndex} className="contents">{groupIndex === 1 && <span className="text-center font-mono text-[10px] text-muted-foreground">{fila}</span>}<div className="grid grid-cols-3 justify-items-center">{group.map((letter) => { const seat = byId[`${fila}${letter}`]; if (!seat) return <span key={letter} className="size-8" />; const isSelected = selectedIds.includes(seat.id); return <Tooltip key={letter}><TooltipTrigger asChild><Button variant="ghost" size="icon" disabled={!editable(seat)} onClick={() => editable(seat) && setSelectedIds(isSelected ? selectedIds.filter((id) => id !== seat.id) : [...selectedIds, seat.id])} aria-label={`Asiento ${seat.id} ${seat.estado}`} className={`flex size-7 rounded-t-md rounded-b-sm border text-[10px] font-medium transition-all hover:bg-transparent sm:size-8 ${seatStyle[seat.estado]} ${editable(seat) ? "cursor-pointer" : "cursor-not-allowed"} ${isSelected ? "scale-110 !border-accent !bg-accent !text-white shadow" : ""}`}>{seat.estado === "BLOQUEADO" ? <Lock className="size-3" /> : letter}</Button></TooltipTrigger><TooltipContent>{seat.id} · {seat.tipo} · ${seat.precio} · {seat.estado}</TooltipContent></Tooltip>; })}</div></div>)}</div></div>)}</div><div className="mx-auto h-4 w-[90%] rounded-b-3xl border-x-2 border-b-2 border-border bg-card" /></div></div></CardContent>
        </Card>
        <Card className="order-first h-fit rounded-xl lg:sticky lg:top-0 lg:order-last"><CardHeader><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Selección</CardTitle></CardHeader><CardContent>{selected.length === 0 ? <p className="text-sm text-muted-foreground">Toca asientos disponibles o bloqueados para editarlos. Los confirmados y con check-in no se pueden modificar.</p> : <div className="anim-up"><div className="flex items-baseline gap-2"><span className="font-mono text-3xl font-medium">{selected.length}</span><span className="text-sm text-muted-foreground">asientos · {selected.slice(0, 6).map((seat) => seat.id).join(", ")}{selected.length > 6 ? "…" : ""}</span></div><div className="mt-4 flex gap-2"><div className="relative flex-1"><span className="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-muted-foreground">$</span><Input type="number" min={0} placeholder="Nuevo precio" value={price} onChange={(event) => setPrice(event.target.value)} className="h-9 pl-7 font-mono" /></div><Button disabled={price === "" || Number(price) < 0} onClick={() => { patch(selectedIds, { precio: Number(price) }, `Precio $${Number(price)}`); setPrice(""); }}><Tag className="size-4" /> Aplicar</Button></div><div className="mt-2 grid grid-cols-2 gap-2"><Button variant="outline" disabled={!selected.some((seat) => seat.estado === "DISPONIBLE")} onClick={() => patch(selected.filter((seat) => seat.estado === "DISPONIBLE").map((seat) => seat.id), { estado: "BLOQUEADO" }, "Bloqueado")}><Lock className="size-4" /> Bloquear</Button><Button variant="outline" disabled={!selected.some((seat) => seat.estado === "BLOQUEADO")} onClick={() => patch(selected.filter((seat) => seat.estado === "BLOQUEADO").map((seat) => seat.id), { estado: "DISPONIBLE" }, "Liberado")}><LockOpen className="size-4" /> Liberar</Button></div><button onClick={() => setSelectedIds([])} className="mt-3 text-xs text-muted-foreground underline">Limpiar selección</button></div>}{log.length > 0 && <div className="mt-5 border-t border-border pt-4"><h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bitácora de asiento</h4><ul className="mt-2 space-y-1.5 font-mono text-xs">{log.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ul></div>}<Dialog><DialogTrigger asChild><Button variant="ghost" className="mt-4 w-full">Ver bitácora local</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Bitácora de {flight.numero}</DialogTitle><DialogDescription>Últimos movimientos de asientos registrados en data3.</DialogDescription></DialogHeader><div className="space-y-2 text-sm">{bitacora.filter((entry) => entry.vuelo === flight.numero).slice(0, 6).map((entry) => <div key={entry.id} className="flex justify-between gap-3 border-b border-border pb-2"><span>{entry.asiento} · {entry.descripcion}</span><Badge variant="outline">{entry.nuevo}</Badge></div>)}</div></DialogContent></Dialog></CardContent></Card>
      </div>
    </div>
  </TooltipProvider>;
}