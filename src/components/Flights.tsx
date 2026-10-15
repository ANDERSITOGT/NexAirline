import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, DoorOpen, Eye, MoreHorizontal, Pencil, Plus, Repeat, Search, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { airportById, flights as seedFlights, fmtDate, fmtTime, gates, planeById, routeLabel, routes, type Estado, type Flight } from "../data1";

const ESTADOS: Estado[] = ["PROGRAMADO", "ABORDANDO", "EN_VUELO", "FINALIZADO", "CANCELADO"];
const PAGE_SIZE = 6;
const inputCls = "h-9 w-full rounded border border-border bg-card px-3 text-sm font-normal text-foreground";
const selectCls = "h-8 w-full rounded border border-border bg-card px-2 text-xs font-normal normal-case tracking-normal text-foreground";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium"><span>{label}</span>{children}{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</label>;
}

function FlightBadge({ value }: { value: string }) {
  const variant = value === "CANCELADO" ? "destructive" : value === "FINALIZADO" ? "secondary" : "default";
  return <Badge variant={variant}>{value}</Badge>;
}

function RowMenu({ flight, onCancel, onDetail, onEdit, onReassign }: { flight: Flight; onCancel: () => void; onDetail: () => void; onEdit: () => void; onReassign: () => void }) {
  const locked = flight.estado === "CANCELADO" || flight.estado === "FINALIZADO";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" className="size-8 p-0" aria-label="Acciones"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onDetail}><Eye className="size-4 text-muted-foreground" /> Ver detalle</DropdownMenuItem>
        <DropdownMenuItem disabled={locked} onClick={onEdit}><Pencil className="size-4 text-muted-foreground" /> Editar horarios</DropdownMenuItem>
        <DropdownMenuItem disabled={locked} onClick={onEdit}><DoorOpen className="size-4 text-muted-foreground" /> Asignar puerta</DropdownMenuItem>
        <DropdownMenuItem disabled={locked} onClick={onReassign}><Repeat className="size-4 text-muted-foreground" /> Reasignar pasajeros</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={locked} className="text-destructive focus:text-destructive" onClick={onCancel}><XCircle className="size-4" /> Cancelar vuelo</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatDateTime(value: string) {
  return value.length > 16 ? value.slice(0, 16) : value;
}

export default function Flights() {
  const navigate = useNavigate();
  const [flightList, setFlightList] = useState(seedFlights);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("");
  const [ruta, setRuta] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [toCancel, setToCancel] = useState<Flight | null>(null);
  const [detail, setDetail] = useState<Flight | null>(null);
  const [draft, setDraft] = useState<Flight | null>(null);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);
  const toast = (message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3000);
  };
  const shift = (flight: Flight, departure: string) => {
    const duration = new Date(flight.llegada).getTime() - new Date(flight.salida).getTime();
    return new Date(new Date(`${departure}:00Z`).getTime() + duration).toISOString().slice(0, 16);
  };
  const rows = useMemo(() => flightList
    .filter((flight) => (!estado || flight.estado === estado) && (!ruta || flight.ruta === Number(ruta)))
    .filter((flight) => `${flight.numero} ${planeById(flight.avion).matricula} ${routeLabel(flight.ruta)}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.salida.localeCompare(a.salida)), [flightList, estado, ruta, query]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = rows.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);
  const allSelected = visible.length > 0 && visible.every((flight) => selected.includes(flight.id));
  const toggleSelected = (id: number) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const selectAll = () => setSelected((current) => allSelected ? current.filter((id) => !visible.some((flight) => flight.id === id)) : [...new Set([...current, ...visible.map((flight) => flight.id)])]);
  const updateDraftDeparture = (value: string) => {
    if (!draft || !value) return;
    const original = flightList.find((flight) => flight.id === draft.id) ?? draft;
    setDraft({ ...draft, salida: value, llegada: shift(original, value) });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Vuelos</h1><p className="mt-1 text-sm text-muted-foreground">{flightList.length} vuelos registrados en la tabla Vuelo</p></div>
        <Button onClick={() => navigate("/vuelos/nuevo")}><Plus className="size-4" /> Programar Vuelo</Button>
      </div>
      {notice && <div role="status" className="anim-fade mb-4 rounded-md border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm">{notice}</div>}

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-52 flex-1 md:max-w-xs"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-9 pl-9" placeholder="Buscar vuelo, ruta o matrícula" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} /></div>
          {selected.length > 0 && <div className="anim-fade flex items-center gap-3 text-sm"><span className="font-medium">{selected.length} seleccionados</span><Button className="h-8" onClick={() => setSelected([])}>Limpiar</Button></div>}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table><TableHeader><TableRow className="bg-background text-xs uppercase tracking-wide text-muted-foreground align-top">
            <TableHead className="w-10 pt-3"><Checkbox checked={allSelected} onCheckedChange={selectAll} aria-label="Seleccionar todos" /></TableHead>
            <TableHead className="pt-3 font-semibold">N.º Vuelo<div className="h-8" /></TableHead>
            <TableHead className="pt-3 font-semibold">Ruta<div className="mt-1.5"><select className={selectCls} value={ruta} onChange={(event) => { setRuta(event.target.value); setPage(0); }}><option value="">Todas</option>{routes.map((route) => <option key={route.id} value={route.id}>{routeLabel(route.id)}</option>)}</select></div></TableHead>
            <TableHead className="pt-3 font-semibold">Avión<div className="h-8" /></TableHead>
            <TableHead className="pt-3 font-semibold">Fecha salida<div className="h-8" /></TableHead>
            <TableHead className="pt-3 font-semibold">Estado<div className="mt-1.5"><select className={selectCls} value={estado} onChange={(event) => { setEstado(event.target.value); setPage(0); }}><option value="">Todos</option>{ESTADOS.map((state) => <option key={state}>{state}</option>)}</select></div></TableHead>
            <TableHead className="w-14 pt-3 text-right font-semibold">Acc.</TableHead>
          </TableRow></TableHeader><TableBody>
            {visible.map((flight) => { const route = routes.find((item) => item.id === flight.ruta)!; const plane = planeById(flight.avion); return <TableRow key={flight.id} className={selected.includes(flight.id) ? "bg-info-bg/40" : "hover:bg-background"}>
              <TableCell><Checkbox checked={selected.includes(flight.id)} onCheckedChange={() => toggleSelected(flight.id)} aria-label={`Seleccionar ${flight.numero}`} /></TableCell><TableCell className="font-mono font-medium">{flight.numero}</TableCell><TableCell><div className="font-mono">{routeLabel(flight.ruta)}</div><div className="text-xs text-muted-foreground">{airportById(route.origen).ciudad} – {airportById(route.destino).ciudad}</div></TableCell><TableCell><div className="font-mono">{plane.matricula}</div><div className="text-xs text-muted-foreground">{plane.modelo}</div></TableCell><TableCell className="font-mono">{fmtDate(flight.salida)} · {fmtTime(flight.salida)}</TableCell><TableCell><FlightBadge value={flight.estado} /></TableCell><TableCell className="text-right"><RowMenu flight={flight} onCancel={() => setToCancel(flight)} onDetail={() => setDetail(flight)} onEdit={() => setDraft({ ...flight })} onReassign={() => navigate("/reasignaciones")} /></TableCell>
            </TableRow>; })}
            {visible.length === 0 && <TableRow><TableCell colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Ningún vuelo coincide con los filtros.</TableCell></TableRow>}
          </TableBody></Table>
        </div>

        <ul className="divide-y divide-border md:hidden">{visible.map((flight) => <li key={flight.id} className="flex items-start gap-3 p-4"><Checkbox className="mt-1" checked={selected.includes(flight.id)} onCheckedChange={() => toggleSelected(flight.id)} aria-label={`Seleccionar ${flight.numero}`} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="font-mono font-medium">{flight.numero}</span><FlightBadge value={flight.estado} /></div><div className="mt-1 font-mono text-sm">{routeLabel(flight.ruta)}</div><div className="mt-0.5 text-xs text-muted-foreground">{planeById(flight.avion).matricula} · {fmtDate(flight.salida)} {fmtTime(flight.salida)}</div></div><RowMenu flight={flight} onCancel={() => setToCancel(flight)} onDetail={() => setDetail(flight)} onEdit={() => setDraft({ ...flight })} onReassign={() => navigate("/reasignaciones")} /></li>)}{visible.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground">Sin resultados.</li>}</ul>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground"><span>{rows.length === 0 ? 0 : currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, rows.length)} de {rows.length}</span><div className="flex items-center gap-2"><span className="font-mono text-xs">Pág. {currentPage + 1}/{pages}</span><Button className="size-8 px-0" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} aria-label="Anterior"><ChevronLeft className="size-4" /></Button><Button className="size-8 px-0" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)} aria-label="Siguiente"><ChevronRight className="size-4" /></Button></div></footer>
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}><DialogContent><DialogHeader><DialogTitle>Vuelo {detail?.numero}</DialogTitle><DialogDescription>{detail ? routeLabel(detail.ruta) : ""}</DialogDescription></DialogHeader>{detail && <><FlightBadge value={detail.estado} /><dl className="divide-y divide-border text-sm">{[["Aeronave", `${planeById(detail.avion).matricula} · ${planeById(detail.avion).modelo}`], ["Capacidad", `${planeById(detail.avion).capacidad} asientos`], ["Salida", `${fmtDate(detail.salida)} ${fmtTime(detail.salida)}`], ["Llegada", `${fmtDate(detail.llegada)} ${fmtTime(detail.llegada)}`], ["Puerta", detail.puerta ?? "Sin asignar"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-2.5"><dt className="text-muted-foreground">{label}</dt><dd className="font-mono">{value}</dd></div>)}</dl></>}<DialogFooter><Button onClick={() => { setDraft(detail); setDetail(null); }}>Editar</Button><Button onClick={() => navigate("/asientos")}>Ver mapa de asientos</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}><DialogContent><DialogHeader><DialogTitle>Editar vuelo {draft?.numero}</DialogTitle><DialogDescription>Horario, puerta y estado</DialogDescription></DialogHeader>{draft && <div className="grid gap-4 py-2"><Field label="Salida" hint="La llegada se recalcula con la misma duración."><Input type="datetime-local" value={formatDateTime(draft.salida)} onChange={(event) => updateDraftDeparture(event.target.value)} /></Field><Field label="Llegada"><Input type="datetime-local" value={formatDateTime(draft.llegada)} readOnly /></Field><Field label="Puerta de embarque"><select className={inputCls} value={draft.puerta ?? ""} onChange={(event) => setDraft({ ...draft, puerta: event.target.value || null })}><option value="">Buscar puerta…</option>{gates.map((gate) => <option key={gate}>{gate}</option>)}</select></Field><Field label="Estado"><select className={inputCls} value={draft.estado} onChange={(event) => setDraft({ ...draft, estado: event.target.value as Estado })}>{ESTADOS.map((state) => <option key={state}>{state}</option>)}</select></Field></div>}<DialogFooter><Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button><Button onClick={() => { if (!draft) return; setFlightList((current) => current.map((flight) => flight.id === draft.id ? draft : flight)); setDraft(null); toast("Vuelo actualizado"); }}>Guardar cambios</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={!!toCancel} onOpenChange={(open) => !open && setToCancel(null)}><DialogContent><DialogHeader><DialogTitle>¿Cancelar el vuelo {toCancel?.numero}?</DialogTitle><DialogDescription>Se notificará a los pasajeros con reserva y los asientos serán liberados. Esta acción no se puede deshacer.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setToCancel(null)}>No cancelar</Button><Button variant="destructive" onClick={() => { if (!toCancel) return; setFlightList((current) => current.map((flight) => flight.id === toCancel.id ? { ...flight, estado: "CANCELADO" } : flight)); setToCancel(null); toast("Vuelo cancelado"); }}>Sí, cancelar vuelo</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
