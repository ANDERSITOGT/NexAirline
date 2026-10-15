import { Fragment, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { flights, routeLabel } from "../data1";
import { reservas, subtotalOf, taxOf, totalOf, type Pax, type Reserva, type ReservaEstado } from "../data2";

const money = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const when = (iso: string | null) => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)} ${iso.slice(11, 16)}` : "—";
const totals = (reservation: Reserva) => ({ subtotal: subtotalOf(reservation), impuestos: taxOf(reservation), total: totalOf(reservation) });

function reservationVariant(status: ReservaEstado): BadgeProps["variant"] {
  return status === "CANCELADA" ? "destructive" : status === "CONFIRMADA" ? "default" : status === "EXPIRADA" ? "secondary" : "outline";
}

function paymentVariant(status: NonNullable<Reserva["pago"]>): BadgeProps["variant"] {
  return status === "RECHAZADO" ? "destructive" : status === "APROBADO" ? "default" : "secondary";
}

function TicketStatus({ passenger }: { passenger: Pax }) {
  if (passenger.boleto === "—") return <span className="text-xs text-muted-foreground">Sin emitir</span>;
  return <Badge variant={passenger.estadoBoleto === "CANCELADO" ? "destructive" : "default"}>{passenger.estadoBoleto}</Badge>;
}

function PassengerDetail({ reservation }: { reservation: Reserva }) {
  const total = totals(reservation);
  return <div className="anim-up space-y-4 bg-background px-4 py-5 md:px-8"><div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"><span className="text-muted-foreground">Cliente <span className="font-medium text-foreground">{reservation.cliente}</span> · {reservation.correo}</span><span className="text-muted-foreground">Pago <span className="ml-1">{reservation.pago ? <Badge variant={paymentVariant(reservation.pago)}>{reservation.pago}</Badge> : "—"}</span>{reservation.metodo && <span> · {reservation.metodo}</span>}</span><span className="font-mono text-xs text-muted-foreground">Itinerario #{reservation.itinerario}</span></div>
    <div className="overflow-x-auto rounded-lg border border-border bg-card"><Table className="min-w-[820px]"><TableHeader><TableRow>{["Pasajero", "Documento", "Vuelo / ruta", "Asiento", "N.º boleto", "Cód. check-in", "Estado", "Precio"].map((heading) => <TableHead key={heading} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">{heading}</TableHead>)}</TableRow></TableHeader><TableBody>{reservation.pax.map((passenger) => <TableRow key={passenger.boleto + passenger.nombre}><TableCell className="px-4 py-2.5 font-medium">{passenger.nombre}</TableCell><TableCell className="px-4 py-2.5 text-muted-foreground">{passenger.doc}</TableCell><TableCell className="px-4 py-2.5"><span className="font-mono">{passenger.vuelo}</span>{flights.find((flight) => flight.numero === passenger.vuelo) && <span className="block text-xs text-muted-foreground">{routeLabel(flights.find((flight) => flight.numero === passenger.vuelo)!.ruta)}</span>}</TableCell><TableCell className="px-4 py-2.5 font-mono">{passenger.asiento}</TableCell><TableCell className="px-4 py-2.5 font-mono">{passenger.boleto}</TableCell><TableCell className="px-4 py-2.5 font-mono">{passenger.checkin}{passenger.checkedIn && <span className="ml-2 text-ok">✓</span>}</TableCell><TableCell className="px-4 py-2.5"><TicketStatus passenger={passenger} /></TableCell><TableCell className="px-4 py-2.5 font-mono">{money(passenger.precio)}</TableCell></TableRow>)}</TableBody></Table></div>
    <dl className="ml-auto grid max-w-xs grid-cols-2 gap-y-1 font-mono text-sm"><dt className="text-muted-foreground">Subtotal</dt><dd className="text-right">{money(total.subtotal)}</dd><dt className="text-muted-foreground">Impuestos (12%)</dt><dd className="text-right">{money(total.impuestos)}</dd><dt className="border-t border-border pt-1 font-semibold">Total</dt><dd className="border-t border-border pt-1 text-right font-semibold">{money(total.total)}</dd></dl>
  </div>;
}

export default function Reservations() {
  const [open, setOpen] = useState<number | null>(20481);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const rows = reservas.filter((reservation) => (!status || reservation.estado === status) && `${reservation.id} ${reservation.cliente}`.toLowerCase().includes(query.toLowerCase()));
  const toggle = (id: number) => setOpen((current) => current === id ? null : id);

  return <div><div className="mb-6"><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Panel de reservas</h1><p className="mt-1 text-sm text-muted-foreground">Expande una reserva para auditar sus boletos sin salir de la página.</p></div><Card className="overflow-hidden rounded-xl"><CardContent className="p-0"><div className="flex flex-wrap gap-3 border-b border-border p-4"><div className="relative min-w-52 flex-1 md:max-w-xs"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-9 pl-9" placeholder="Buscar por N.º o cliente" value={query} onChange={(event) => setQuery(event.target.value)} /></div><select className="h-9 w-auto rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por estado"><option value="">Todos los estados</option>{["PENDIENTE", "CONFIRMADA", "EXPIRADA", "CANCELADA"].map((item) => <option key={item}>{item}</option>)}</select></div>
      <div className="hidden overflow-x-auto md:block"><Table className="min-w-[820px]"><TableHeader><TableRow className="bg-background"><TableHead className="w-12 px-4 py-3" />{["Reserva", "Cliente", "Estado", "Creada", "Expira", "Pasajeros"].map((heading) => <TableHead key={heading} className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">{heading}</TableHead>)}<TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Total</TableHead></TableRow></TableHeader><TableBody>{rows.map((reservation) => <Fragment key={reservation.id}><TableRow onClick={() => toggle(reservation.id)} className={`cursor-pointer ${open === reservation.id ? "bg-background" : "hover:bg-background"}`}><TableCell className="px-4 py-3"><Button variant="ghost" size="icon" aria-label={`Expandir reserva ${reservation.id}`} aria-expanded={open === reservation.id} onClick={(event) => { event.stopPropagation(); toggle(reservation.id); }}><ChevronRight className={`size-4 transition-transform ${open === reservation.id ? "rotate-90" : ""}`} /></Button></TableCell><TableCell className="px-3 py-3 font-mono font-medium">#{reservation.id}</TableCell><TableCell className="px-3 py-3">{reservation.cliente}</TableCell><TableCell className="px-3 py-3"><Badge variant={reservationVariant(reservation.estado)}>{reservation.estado}</Badge></TableCell><TableCell className="px-3 py-3 font-mono text-muted-foreground">{when(reservation.creada)}</TableCell><TableCell className="px-3 py-3 font-mono text-muted-foreground">{when(reservation.expira)}</TableCell><TableCell className="px-3 py-3 font-mono">{reservation.pax.length}</TableCell><TableCell className="px-4 py-3 text-right font-mono font-medium">{money(totals(reservation).total)}</TableCell></TableRow>{open === reservation.id && <TableRow><TableCell colSpan={8} className="border-t border-border p-0"><PassengerDetail reservation={reservation} /></TableCell></TableRow>}</Fragment>)}</TableBody></Table></div>
      <div className="divide-y divide-border md:hidden">{rows.map((reservation) => <div key={reservation.id}><div className="flex items-center gap-3 px-4 py-3.5"><Button variant="ghost" size="icon" aria-label={`Expandir reserva ${reservation.id}`} aria-expanded={open === reservation.id} onClick={() => toggle(reservation.id)}><ChevronRight className={`size-4 shrink-0 transition-transform ${open === reservation.id ? "rotate-90" : ""}`} /></Button><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="font-mono font-medium">#{reservation.id}</span><Badge variant={reservationVariant(reservation.estado)}>{reservation.estado}</Badge></div><div className="mt-0.5 flex justify-between text-sm text-muted-foreground"><span className="truncate">{reservation.cliente}</span><span className="font-mono">{money(totals(reservation).total)}</span></div></div></div>{open === reservation.id && <PassengerDetail reservation={reservation} />}</div>)}</div>
      {rows.length === 0 && <p className="px-4 py-12 text-center text-sm text-muted-foreground">Sin reservas con esos filtros.</p>}
    </CardContent></Card></div>;
}