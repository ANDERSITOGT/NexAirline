import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";
import { Ban, ChevronRight, Loader2, Pencil, Search } from "lucide-react";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cancelReservation,
  getReservations,
  updatePassenger,
  type Reservation,
  type ReservationDetail,
  type ReservationStatus,
  type UpdatePassengerData,
} from "@/services/reservationService";

const money = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const when = (iso?: string | null) =>
  iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)} ${iso.slice(11, 16)}` : "—";

const reservationDates = (reservation: Reservation) => ({
  created: reservation.fecha_creacion ?? reservation.creada,
  expires: reservation.fecha_expiracion ?? reservation.expira,
});

const reservationDetails = (reservation: Reservation) => reservation.detalles ?? [];

const reservationTotal = (reservation: Reservation) =>
  reservationDetails(reservation).reduce((total, detail) => total + detail.precio, 0);

const reservationTax = (reservation: Reservation) =>
  Math.round(reservationTotal(reservation) * 12) / 100;

const reservationPnr = (reservation: Reservation) =>
  reservationDetails(reservation)[0]?.boletos?.[0]?.codigo_checkin ?? null;

function reservationVariant(status: ReservationStatus): BadgeProps["variant"] {
  return status === "CANCELADA"
    ? "destructive"
    : status === "CONFIRMADA"
      ? "default"
      : status === "EXPIRADA"
        ? "secondary"
        : "outline";
}

function ticketStatus(detail: ReservationDetail) {
  const status = detail.boletos?.[0]?.estado;
  if (!status) return <span className="text-xs text-muted-foreground">Sin emitir</span>;
  return <Badge variant={status === "CANCELADO" ? "destructive" : "default"}>{status}</Badge>;
}

function passengerSeat(detail: ReservationDetail) {
  return (
    detail.vuelo_asiento?.asiento?.numero ??
    detail.vueloAsiento?.asiento?.numero ??
    detail.vuelo_asiento?.asiento?.nombre ??
    detail.vueloAsiento?.asiento?.nombre ??
    "—"
  );
}

function passengerTicket(detail: ReservationDetail) {
  return detail.boletos?.[0]?.numero_boleto ?? detail.boletos?.[0]?.numero ?? "—";
}

function PassengerDetail({
  reservation,
  onCancel,
  onEditPassenger,
  isCancelling,
}: {
  reservation: Reservation;
  onCancel: (reservation: Reservation) => void;
  onEditPassenger: (detail: ReservationDetail) => void;
  isCancelling: boolean;
}) {
  const total = reservationTotal(reservation);
  const dates = reservationDates(reservation);
  return (
    <div className="anim-up space-y-4 bg-background px-4 py-5 md:px-8">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <span className="text-muted-foreground">
          Cliente{" "}
          <span className="font-medium text-foreground">{reservation.cliente.nombre}</span>
          {reservation.cliente.correo && <> · {reservation.cliente.correo}</>}
        </span>
        <span className="text-muted-foreground">
          Pago <span className="ml-1">{reservation.pago ?? reservation.metodo_pago ?? "—"}</span>
        </span>
        {reservation.itinerario_id != null && (
          <span className="font-mono text-xs text-muted-foreground">
            Itinerario #{reservation.itinerario_id}
          </span>
        )}
        {reservation.estado !== "CANCELADA" && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isCancelling}
            onClick={() => onCancel(reservation)}
          >
            {isCancelling ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
            Cancelar Reserva
          </Button>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow>
              {["Pasajero", "Documento", "Vuelo / ruta", "Asiento", "N.º boleto", "Cód. check-in", "Estado", "Precio"].map(
                (heading) => (
                  <TableHead key={heading} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">
                    {heading}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservationDetails(reservation).map((detail) => {
              const ticket = detail.boletos?.[0];
              return (
                <TableRow key={detail.id}>
                  <TableCell className="px-4 py-2.5 font-medium">
                    <div className="flex items-center gap-1">
                      <span>{detail.nombre_pasajero}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Editar pasajero ${detail.nombre_pasajero}`}
                        onClick={() => onEditPassenger(detail)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-muted-foreground">
                    {detail.numero_documento ?? detail.numeroDocumento ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-mono text-xs">
                    <div>{detail.numero_vuelo ?? detail.numeroVuelo ?? "—"}</div>
                    <div className="text-muted-foreground">{detail.ruta ?? "—"}</div>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 font-mono">{passengerSeat(detail)}</TableCell>
                  <TableCell className="px-4 py-2.5 font-mono">{passengerTicket(detail)}</TableCell>
                  <TableCell className="px-4 py-2.5 font-mono">{ticket?.codigo_checkin ?? "—"}</TableCell>
                  <TableCell className="px-4 py-2.5">{ticketStatus(detail)}</TableCell>
                  <TableCell className="px-4 py-2.5 font-mono">{money(detail.precio)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <dl className="ml-auto grid max-w-xs grid-cols-2 gap-y-1 font-mono text-sm">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="text-right">{money(total)}</dd>
        <dt className="text-muted-foreground">Impuestos (12%)</dt>
        <dd className="text-right">{money(reservationTax(reservation))}</dd>
        <dt className="border-t border-border pt-1 font-semibold">Total</dt>
        <dd className="border-t border-border pt-1 text-right font-semibold">
          {money(total + reservationTax(reservation))}
        </dd>
      </dl>
      {dates.created && (
        <p className="text-xs text-muted-foreground">
          Creada: {when(dates.created)}{dates.expires ? ` · Expira: ${when(dates.expires)}` : ""}
        </p>
      )}
    </div>
  );
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [reservaACancelar, setReservaACancelar] = useState<Reservation | null>(null);
  const [pasajeroAEditar, setPasajeroAEditar] = useState<ReservationDetail | null>(null);
  const [formData, setFormData] = useState<UpdatePassengerData>({
    nombre_pasajero: "",
    apellido_pasajero: "",
    tipo_documento: "",
    numero_documento: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const loadReservations = async () => {
    setLoading(true);
    setError("");
    try {
      setReservations(await getReservations());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar las reservas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadReservations(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleEditPassenger = (detail: ReservationDetail) => {
    setPasajeroAEditar(detail);
    setFormData({
      nombre_pasajero: detail.nombre_pasajero,
      apellido_pasajero: detail.apellido_pasajero ?? "",
      tipo_documento: detail.tipo_documento ?? "",
      numero_documento: detail.numero_documento ?? detail.numeroDocumento ?? "",
    });
  };

  const rows = useMemo(
    () =>
      reservations.filter((reservation) => {
        const searchable = [
          reservation.id,
          reservationPnr(reservation) ?? "",
          reservation.cliente.nombre,
          reservation.cliente.correo ?? "",
          ...reservationDetails(reservation).flatMap((detail) => [
            detail.nombre_pasajero,
            detail.numero_documento ?? "",
            detail.numeroDocumento ?? "",
            detail.numero_vuelo ?? "",
            detail.numeroVuelo ?? "",
            ...(detail.boletos ?? []).flatMap((ticket) => [
              ticket.codigo_checkin ?? "",
              ticket.numero_boleto ?? "",
              ticket.numero ?? "",
            ]),
          ]),
        ]
          .join(" ")
          .toLowerCase();
        return (!status || reservation.estado === status) && searchable.includes(query.toLowerCase());
      }),
    [query, reservations, status],
  );

  const toggle = (id: number) => setOpen((current) => (current === id ? null : id));

  const handleCancel = async (reservation: Reservation) => {
    setCancellingId(reservation.id);
    setError("");
    try {
      await cancelReservation(reservation.id);
      await loadReservations();
      setReservaACancelar(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cancelar la reserva.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleUpdatePassenger = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pasajeroAEditar) return;

    setIsUpdating(true);
    setError("");
    try {
      await updatePassenger(pasajeroAEditar.id, formData);
      await loadReservations();
      setPasajeroAEditar(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el pasajero.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <AppBreadcrumb items={[{ label: "Ventas", href: "/ventas" }, { label: "Reservas" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Panel de reservas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Expande una reserva para auditar sus boletos sin salir de la página.
        </p>
      </div>
      <Card className="overflow-hidden rounded-xl">
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-3 border-b border-border p-4">
            <div className="relative min-w-52 flex-1 md:max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-9"
                placeholder="Buscar por Código, Boleto, DPI o Cliente"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              className="h-9 w-auto rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="">Todos los estados</option>
              {["PENDIENTE", "CONFIRMADA", "EXPIRADA", "CANCELADA"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          {error && <p className="border-b border-bad/30 bg-bad-bg px-4 py-3 text-sm text-bad">{error}</p>}
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Cargando reservas...
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow className="bg-background">
                      <TableHead className="w-12 px-4 py-3" />
                      {["Reserva", "Cliente", "Estado", "Creada", "Expira", "Pasajeros"].map((heading) => (
                        <TableHead key={heading} className="px-3 py-3 text-xs font-semibold uppercase tracking-wide">
                          {heading}
                        </TableHead>
                      ))}
                      <TableHead className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((reservation) => {
                      const dates = reservationDates(reservation);
                      return (
                        <Fragment key={reservation.id}>
                          <TableRow
                            onClick={() => toggle(reservation.id)}
                            className={`cursor-pointer ${open === reservation.id ? "bg-background" : "hover:bg-background"}`}
                          >
                            <TableCell className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Expandir reserva ${reservation.id}`}
                                aria-expanded={open === reservation.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggle(reservation.id);
                                }}
                              >
                                <ChevronRight className={`size-4 transition-transform ${open === reservation.id ? "rotate-90" : ""}`} />
                              </Button>
                            </TableCell>
                            <TableCell className="px-3 py-3">
                              <div className="font-mono font-medium">{reservationPnr(reservation) ?? `#${reservation.id}`}</div>
                              <div className="text-xs text-muted-foreground">Ref: #{reservation.id}</div>
                            </TableCell>
                            <TableCell className="px-3 py-3">{reservation.cliente.nombre}</TableCell>
                            <TableCell className="px-3 py-3">
                              <Badge variant={reservationVariant(reservation.estado)}>{reservation.estado}</Badge>
                            </TableCell>
                            <TableCell className="px-3 py-3 font-mono text-muted-foreground">{when(dates.created)}</TableCell>
                            <TableCell className="px-3 py-3 font-mono text-muted-foreground">{when(dates.expires)}</TableCell>
                            <TableCell className="px-3 py-3 font-mono">{reservationDetails(reservation).length}</TableCell>
                            <TableCell className="px-4 py-3 text-right font-mono font-medium">{money(reservationTotal(reservation))}</TableCell>
                          </TableRow>
                          {open === reservation.id && (
                            <TableRow>
                              <TableCell colSpan={8} className="border-t border-border p-0">
                                <PassengerDetail
                                  reservation={reservation}
                                  onCancel={setReservaACancelar}
                                  onEditPassenger={handleEditPassenger}
                                  isCancelling={cancellingId === reservation.id}
                                />
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="divide-y divide-border md:hidden">
                {rows.map((reservation) => (
                  <div key={reservation.id}>
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Expandir reserva ${reservation.id}`}
                        aria-expanded={open === reservation.id}
                        onClick={() => toggle(reservation.id)}
                      >
                        <ChevronRight className={`size-4 shrink-0 transition-transform ${open === reservation.id ? "rotate-90" : ""}`} />
                      </Button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-mono font-medium">{reservationPnr(reservation) ?? `#${reservation.id}`}</div>
                            <div className="text-xs text-muted-foreground">Ref: #{reservation.id}</div>
                          </div>
                          <Badge variant={reservationVariant(reservation.estado)}>{reservation.estado}</Badge>
                        </div>
                        <div className="mt-0.5 flex justify-between text-sm text-muted-foreground">
                          <span className="truncate">{reservation.cliente.nombre}</span>
                          <span className="font-mono">{money(reservationTotal(reservation))}</span>
                        </div>
                      </div>
                    </div>
                    {open === reservation.id && (
                      <PassengerDetail
                        reservation={reservation}
                        onCancel={setReservaACancelar}
                        onEditPassenger={handleEditPassenger}
                        isCancelling={cancellingId === reservation.id}
                      />
                    )}
                  </div>
                ))}
              </div>
              {rows.length === 0 && <p className="px-4 py-12 text-center text-sm text-muted-foreground">Sin reservas con esos filtros.</p>}
            </>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={!!reservaACancelar}
        onOpenChange={(isOpen) => !isOpen && !cancellingId && setReservaACancelar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ¿Cancelar reserva {reservaACancelar ? reservationPnr(reservaACancelar) ?? `#${reservaACancelar.id}` : ""}?
            </DialogTitle>
            <DialogDescription>
              Esta acción es irreversible. Se liberarán los asientos y se invalidarán los boletos de todos los pasajeros asociados a esta reserva.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={!!cancellingId}
              onClick={() => setReservaACancelar(null)}
            >
              Volver
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!reservaACancelar || !!cancellingId}
              onClick={() => reservaACancelar && void handleCancel(reservaACancelar)}
            >
              {cancellingId ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
              Sí, cancelar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!pasajeroAEditar}
        onOpenChange={(isOpen) => !isOpen && !isUpdating && setPasajeroAEditar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar datos del pasajero</DialogTitle>
            <DialogDescription>
              Corrige el nombre o el documento del pasajero y guarda los cambios.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={(event) => void handleUpdatePassenger(event)}>
            <label className="grid gap-1.5 text-sm font-medium">
              Nombre
              <Input
                required
                value={formData.nombre_pasajero}
                onChange={(event) => setFormData((current) => ({ ...current, nombre_pasajero: event.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Apellido
              <Input
                required
                value={formData.apellido_pasajero}
                onChange={(event) => setFormData((current) => ({ ...current, apellido_pasajero: event.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Tipo de documento
              <Input
                required
                value={formData.tipo_documento}
                onChange={(event) => setFormData((current) => ({ ...current, tipo_documento: event.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Número de documento
              <Input
                required
                value={formData.numero_documento}
                onChange={(event) => setFormData((current) => ({ ...current, numero_documento: event.target.value }))}
              />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isUpdating} onClick={() => setPasajeroAEditar(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="size-4 animate-spin" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
