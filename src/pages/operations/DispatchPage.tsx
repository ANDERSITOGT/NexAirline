import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, ClipboardCheck, Loader2, ShoppingCart } from "lucide-react";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getVueloById, type Flight } from "@/services/flightService";
import { getPlaneById, type Plane } from "@/services/planeService";
import { getSeatsByPlane, type Seat } from "@/services/seatService";
import { getAll, type SeatType } from "@/services/seatTypeService";
import { EmergencySaleDialog } from "@/components/operations/EmergencySaleDialog";
import {
  reservarTemporal,
  updateDispatchSeatStatus,
  type VentaMostradorResponse,
  type ManualSeatStatus,
} from "@/services/despachoService";
import {
  getInventario,
  type DispatchSeatStatus,
} from "@/services/vueloAsientoService";

const STATUS_STYLES: Record<DispatchSeatStatus, string> = {
  DISPONIBLE: "border-slate-400 bg-slate-200 text-slate-800",
  RESERVADO: "border-yellow-400 bg-yellow-300 text-yellow-950",
  OCUPADO: "border-blue-500 bg-blue-500 text-white",
  CONFIRMADO: "border-blue-500 bg-blue-500 text-white",
  CHECKED_IN: "border-emerald-500 bg-emerald-500 text-white",
  BLOQUEADO: "border-red-500 bg-red-500 text-white",
  RESERVADO_TEMPORAL: "border-yellow-400 bg-yellow-300 text-yellow-950",
};

const STATUS_LABELS: Record<DispatchSeatStatus, string> = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  OCUPADO: "Ocupado",
  CONFIRMADO: "Confirmado",
  CHECKED_IN: "Checked-in",
  BLOQUEADO: "Bloqueado",
  RESERVADO_TEMPORAL: "Reservado temporal",
};

const statuses = Object.keys(STATUS_LABELS) as DispatchSeatStatus[];
const MANUAL_STATUS_LABELS: Record<ManualSeatStatus, string> = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  OCUPADO: "Ocupado",
  CONFIRMADO: "Confirmado",
  CHECKED_IN: "Checked-in",
  BLOQUEADO: "Bloqueado",
  RESERVADO_TEMPORAL: "Reservado temporal",
};

type DispatchSeat = Seat & {
  estado: DispatchSeatStatus;
  vueloAsientoId?: number;
  precio?: number | null;
};

type Notice = { kind: "success" | "error"; message: string };

const errorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : "No se pudo completar la operación.";

const mergeInventory = (
  seats: Seat[],
  inventory: Awaited<ReturnType<typeof getInventario>>,
) : DispatchSeat[] =>
  seats.map((seat) => {
    const commercial = inventory.find(
      (item) => (item.asientoId ?? item.asiento_id) === seat.id,
    );
    const estado = commercial?.estado;
    return {
      ...seat,
      estado: estado && STATUS_LABELS[estado] ? estado : "DISPONIBLE",
      vueloAsientoId: commercial?.id,
      precio: commercial?.precio,
    };
  });

export default function DispatchPage() {
  const { vueloId } = useParams<{ vueloId: string }>();
  const parsedVueloId = Number(vueloId);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [plane, setPlane] = useState<Plane | null>(null);
  const [seatTypes, setSeatTypes] = useState<SeatType[]>([]);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [seats, setSeats] = useState<DispatchSeat[]>([]);
  const [selected, setSelected] = useState<DispatchSeat | null>(null);
  const [nextStatus, setNextStatus] = useState<ManualSeatStatus | "">("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const successNoticeTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [search, setSearch] = useState("");
  const closedFlight = flight?.estado === "EN_VUELO" || flight?.estado === "FINALIZADO" || flight?.estado === "CANCELADO";
  const availableStatusOptions = useMemo<ManualSeatStatus[]>(() => (
    selected?.estado === "DISPONIBLE"
      ? ["BLOQUEADO"]
      : selected?.estado === "BLOQUEADO"
        ? ["DISPONIBLE"]
        : selected?.estado === "CONFIRMADO"
          ? ["CHECKED_IN", "DISPONIBLE"]
          : selected?.estado === "CHECKED_IN"
            ? ["CONFIRMADO", "DISPONIBLE"]
            : selected?.estado === "RESERVADO_TEMPORAL"
            ? ["DISPONIBLE"]
            : []
  ), [selected?.estado]);
  const availableNextStatuses = useMemo(
    () => availableStatusOptions.map((status) => ({
      value: status,
      label: selected?.estado === "RESERVADO_TEMPORAL" && status === "DISPONIBLE"
        ? "Disponible (Liberar / Cancelar reserva)"
        : MANUAL_STATUS_LABELS[status],
    })),
    [availableStatusOptions, selected?.estado],
  );
  const effectiveNextStatus = nextStatus && availableStatusOptions.includes(nextStatus)
    ? nextStatus
    : "";

  const loadDispatch = useCallback(async () => {
    if (!vueloId) {
      setLoading(false);
      setError("No se especificó un vuelo.");
      return;
    }
    if (!Number.isInteger(parsedVueloId) || parsedVueloId <= 0) {
      setError("El identificador del vuelo no es válido.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const loadedFlight = await getVueloById(parsedVueloId);
      console.log("DEBUG VUELO:", loadedFlight);
      const planeId =
        loadedFlight.avion_id || loadedFlight.avionId || loadedFlight.avion?.id;
      if (!planeId || planeId <= 0) {
        throw new Error("El vuelo no tiene un avión asociado.");
      }
      const [loadedPlane, commercialSeats, loadedTypes] = await Promise.all([
        getPlaneById(planeId),
        getInventario(parsedVueloId),
        getAll(),
      ]);
      const physicalSeats = await getSeatsByPlane(loadedPlane.id);
      const merged = mergeInventory(physicalSeats, commercialSeats);
      setFlight(loadedFlight);
      setPlane(loadedPlane);
      setSeatTypes(loadedTypes);
      setInventoryLoaded(true);
      setSeats(merged);
      setSelected(null);
    } catch (cause) {
      setError(errorMessage(cause));
      setFlight(null);
      setPlane(null);
      setInventoryLoaded(false);
      setSeats([]);
    } finally {
      setLoading(false);
    }
  }, [parsedVueloId, vueloId]);

  const refreshSeatInventory = useCallback(async () => {
    const inventory = await getInventario(parsedVueloId);
    setSeats((current) => mergeInventory(current, inventory));
    setSelected((current) => {
      if (!current) return current;
      const refreshed = mergeInventory([current], inventory)[0];
      return refreshed ?? current;
    });
  }, [parsedVueloId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDispatch();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDispatch]);

  const typeNames = useMemo(
    () => new Map(seatTypes.map((type) => [type.id, type.nombre])),
    [seatTypes],
  );
  const rows = useMemo(
    () => Array.from(new Set(seats.map((seat) => seat.fila))).sort((a, b) => a - b),
    [seats],
  );
  const seatsByRow = useMemo(
    () =>
      seats.reduce<Record<number, DispatchSeat[]>>((result, seat) => {
        (result[seat.fila] ??= []).push(seat);
        return result;
      }, {}),
    [seats],
  );

  const filteredSeats = seats.filter((seat) =>
    `${seat.numero} ${seat.fila}${seat.letra} ${STATUS_LABELS[seat.estado]}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const requestStatusUpdate = () => {
    if (!selected?.vueloAsientoId || !reason.trim() || saving) return;
    setConfirmOpen(true);
  };

  const updateStatus = async () => {
    if (!selected?.vueloAsientoId || !reason.trim() || !effectiveNextStatus || saving) return;
    setSaving(true);
    setNotice(null);
    setConfirmOpen(false);
    try {
      await updateDispatchSeatStatus(selected.vueloAsientoId, {
        nuevo_estado: effectiveNextStatus,
        descripcion: reason.trim(),
      });
      setNotice({ kind: "success", message: "Estado del asiento actualizado" });
      setReason("");
      setSelected(null);
      void refreshSeatInventory().catch((cause) => {
        setNotice({ kind: "error", message: errorMessage(cause) });
      });
    } catch (cause) {
      setNotice({ kind: "error", message: errorMessage(cause) });
    } finally {
      setSaving(false);
    }
  };

  const quickCheckIn = async () => {
    if (closedFlight || !selected?.vueloAsientoId || saving || selected.estado !== "CONFIRMADO") return;
    setSaving(true);
    setNotice(null);
    try {
      await updateDispatchSeatStatus(selected.vueloAsientoId, {
        nuevo_estado: "CHECKED_IN",
        descripcion: "Check-in rápido en mostrador",
      });
      setNotice({ kind: "success", message: "Check-in completado" });
      void refreshSeatInventory().catch((cause) => {
        setNotice({ kind: "error", message: errorMessage(cause) });
      });
    } catch (cause) {
      setNotice({ kind: "error", message: errorMessage(cause) });
    } finally {
      setSaving(false);
    }
  };

  const handleSaleCompleted = useCallback((response: VentaMostradorResponse) => {
    setError(null);
    setSelected((current) => current ? { ...current, estado: "CONFIRMADO" } : current);
    const ticket = response.boleto?.numero_boleto ?? response.numero_boleto ?? response.boleto?.numero;
    setNotice({ kind: "success", message: ticket ? `Venta confirmada. Boleto ${ticket}` : "Venta confirmada correctamente." });
    if (successNoticeTimer.current) {
      window.clearTimeout(successNoticeTimer.current);
    }
    successNoticeTimer.current = window.setTimeout(() => {
      setNotice(null);
      successNoticeTimer.current = null;
    }, 5000);
    void refreshSeatInventory().catch((cause) => setNotice({ kind: "error", message: errorMessage(cause) }));
  }, [refreshSeatInventory]);

  useEffect(() => () => {
    if (successNoticeTimer.current) {
      window.clearTimeout(successNoticeTimer.current);
    }
  }, []);

  const dismissNotice = () => {
    if (successNoticeTimer.current) {
      window.clearTimeout(successNoticeTimer.current);
      successNoticeTimer.current = null;
    }
    setNotice(null);
  };

  const handleSaleError = useCallback((message: string) => {
    setNotice({ kind: "error", message });
  }, []);

  const handleSaleDialogOpenChange = useCallback((open: boolean) => {
    setIsSaleDialogOpen(open);
    if (!open) {
      void refreshSeatInventory().catch((cause) => {
        setNotice({ kind: "error", message: errorMessage(cause) });
      });
    }
  }, [refreshSeatInventory]);
  const openEmergencySale = () => {
    if (closedFlight || !selected?.vueloAsientoId || saving) return;
    setError(null);
    setIsSaleDialogOpen(true);
    void reservarTemporal(selected.vueloAsientoId)
      .then(() => refreshSeatInventory())
      .catch((cause) => {
        setIsSaleDialogOpen(false);
        setNotice({ kind: "error", message: errorMessage(cause) });
      });
  };
  const handleSaleReleased = useCallback(() => {
    void refreshSeatInventory();
  }, [refreshSeatInventory]);

  const statusCounts = seats.reduce<Record<string, number>>((result, seat) => {
    result[seat.estado] = (result[seat.estado] ?? 0) + 1;
    return result;
  }, {});

  return (
    <div className="w-full min-w-0">
      <AppBreadcrumb
        items={[
          { label: "Operaciones", href: "/operaciones" },
          { label: "Vuelos", href: "/operaciones/vuelos" },
          { label: "Despacho" },
        ]}
      />
      <Link
        className="mb-4 inline-flex text-sm text-muted-foreground hover:text-foreground hover:underline"
        to="/operaciones/vuelos"
      >
        ← Volver a vuelos
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Centro de Despacho y Check-in
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="text-sm font-semibold text-foreground">
              {flight?.numero_vuelo || flight?.numeroVuelo || `Vuelo #${vueloId}`}
            </span>
            <span>•</span>
            <span>
              {flight?.ruta?.aeropuerto_origen?.ciudad
                || flight?.aeropuerto_origen?.ciudad
                || "Origen"} ({flight?.ruta?.aeropuerto_origen?.codigo_iata
                || flight?.aeropuerto_origen?.codigo_iata
                || "IATA"})
              {" ➔ "}
              {flight?.ruta?.aeropuerto_destino?.ciudad
                || flight?.aeropuerto_destino?.ciudad
                || "Destino"} ({flight?.ruta?.aeropuerto_destino?.codigo_iata
                || flight?.aeropuerto_destino?.codigo_iata
                || "IATA"})
            </span>
            <span>•</span>
            <span>Matrícula: {flight?.avion?.matricula || plane?.matricula || "TG-TJA"}</span>
            <span>•</span>
            <Badge variant="outline" className="text-[10px] uppercase">
              {flight?.estado || "—"}
            </Badge>
          </div>
        </p>
      </div>
      {!loading && error && (
        <div className="mb-4 rounded-md border border-bad/30 bg-bad-bg px-4 py-2 text-sm text-bad">
          {error}
        </div>
      )}
      {closedFlight && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950">
          ⚠️ Vuelo cerrado para despacho (Estado: {flight?.estado}). Modo solo lectura activo.
        </div>
      )}
      <div className="flex h-[calc(100vh-140px)] min-h-0 gap-4 overflow-hidden lg:flex-row">
        <div className="min-w-0 flex-1 h-full overflow-y-auto pr-3">
        <Card className="min-w-0 rounded-xl">
          <CardHeader className="p-4 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>{flight?.numeroVuelo ?? "Mapa de cabina"}</CardTitle>
                <CardDescription className="mt-1">
                  {seats.length} asientos · {plane?.nombre ?? "Aeronave"}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {statuses.map((status) => (
                  <span key={status} className="flex items-center gap-1">
                    <Badge className={`size-3 rounded-sm p-0 ${STATUS_STYLES[status]}`} />
                    {STATUS_LABELS[status]} ({statusCounts[status] ?? 0})
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {loading ? (
              <p className="flex justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Cargando mapa...
              </p>
            ) : !flight || !plane || !inventoryLoaded ? (
              <p className="flex justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Cargando datos de la cabina...
              </p>
            ) : seats.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No hay asientos configurados para esta aeronave.
              </p>
            ) : (
              <CabinGrid
                rows={rows}
                seatsByRow={seatsByRow}
                selectedId={selected?.id}
                onSelect={setSelected}
              />
            )}
          </CardContent>
        </Card>
        </div>
        <div className="order-first h-full w-80 shrink-0 lg:order-last">
        <Card className="h-fit rounded-xl">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="size-5" /> Control de despacho
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {notice && (
              <div
                role={notice.kind === "error" ? "alert" : "status"}
                className={`relative rounded-md border px-3 py-2 pr-8 text-sm transition-opacity duration-300 ${
                  notice.kind === "error"
                    ? "border-bad/30 bg-bad-bg text-bad"
                    : "border-ok/30 bg-ok-bg text-ok"
                }`}
              >
                {notice.message}
                <button
                  type="button"
                  aria-label="Cerrar notificación"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-70 transition-opacity hover:opacity-100"
                  onClick={dismissNotice}
                >
                  ✕
                </button>
              </div>
            )}
            <section className="space-y-3">
              <Popover open={openSearch} onOpenChange={setOpenSearch}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="h-9 w-full justify-start text-xs font-normal">
                    {selected ? `Asiento seleccionado: ${selected.numero}` : "Buscar asiento: 1A, 4G..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[288px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      value={search}
                      onValueChange={setSearch}
                      placeholder="Buscar asiento..."
                      className="h-9 py-1 text-xs"
                    />
                    <CommandList>
                      <CommandEmpty>No se encontraron asientos.</CommandEmpty>
                      {filteredSeats.map((seat) => (
                        <button
                          key={seat.id}
                          type="button"
                          role="option"
                          className="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => {
                            setSelected(seat);
                            setOpenSearch(false);
                            setSearch("");
                          }}
                        >
                          <span className="font-medium">{seat.numero}</span>
                          <span className="text-xs text-muted-foreground">{STATUS_LABELS[seat.estado]}</span>
                        </button>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </section>
            <section className="space-y-3 border-t pt-3">
              <div>
                <h2 className="font-semibold">Detalles del asiento</h2>
                <p className="text-xs text-muted-foreground">Gestiona el estado operativo del asiento.</p>
              </div>
              {selected ? (
                <>
                  <div className="flex flex-wrap items-center gap-1.5 rounded-md bg-muted/50 p-2 text-xs">
                    <span className="font-semibold">Asiento {selected.numero}</span>
                    <span>·</span>
                    <span>{typeNames.get(selected.tipoAsientoId) ?? "Sin clase"}</span>
                    <span>·</span>
                    <span>USD {(selected.precio ?? 0).toFixed(2)}</span>
                    <Badge variant="outline" className={STATUS_STYLES[selected.estado]}>
                      {STATUS_LABELS[selected.estado]}
                    </Badge>
                  </div>
                  {!selected.vueloAsientoId && (
                    <p className="text-xs text-bad">
                      Este asiento no tiene inventario comercial inicializado.
                    </p>
                  )}
                  {selected.estado === "DISPONIBLE" && (
                    <Button
                      type="button"
                      className="h-9 w-full bg-amber-500 text-xs text-amber-950 hover:bg-amber-600"
                      onClick={openEmergencySale}
                      disabled={closedFlight || saving}
                    >
                      <ShoppingCart className="size-4" /> 🛒 Venta en Mostrador
                    </Button>
                  )}
                  <Button
                    type="button"
                    className="h-9 w-full bg-emerald-600 text-xs hover:bg-emerald-700"
                    onClick={() => void quickCheckIn()}
                    title={selected.estado === "CONFIRMADO" ? undefined : "Solo asientos confirmados pueden realizar check-in"}
                    disabled={closedFlight || !selected.vueloAsientoId || selected.estado !== "CONFIRMADO" || saving}
                  >
                    <Check className="size-4" /> ⚡ Check-in Rápido
                  </Button>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Nuevo estado
                    <select
                      value={effectiveNextStatus ?? ""}
                      onChange={(event) => setNextStatus(event.target.value as ManualSeatStatus | "")}
                      aria-label="Nuevo estado"
                      disabled={closedFlight || availableNextStatuses.length === 0}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="" disabled>-- Selecciona un estado operativo --</option>
                      {availableNextStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium">
                    Motivo / Descripción
                    <Input
                      className="h-9 text-xs"
                      required
                      value={reason}
                      placeholder="Motivo del cambio..."
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </label>
                  <Button
                    onClick={requestStatusUpdate}
                    disabled={closedFlight || !selected.vueloAsientoId || !reason.trim() || !effectiveNextStatus || saving}
                  >
                    <Check className="size-4" />
                    {selected.estado === "RESERVADO_TEMPORAL"
                      ? "Liberar Asiento"
                      : nextStatus === "CHECKED_IN"
                        ? "Confirmar Check-in"
                        : "Actualizar Estado"}
                  </Button>
                </>
              ) : (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Selecciona un asiento en el mapa o búscalo arriba para gestionarlo.
                </p>
              )}
            </section>
          </CardContent>
        </Card>
        </div>
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar cambio de estado</DialogTitle>
            <DialogDescription>
              Se cambiará el asiento {selected?.numero} de{" "}
              <strong>{selected ? STATUS_LABELS[selected.estado] : "—"}</strong>{" "}
              a                             <strong>{nextStatus ? MANUAL_STATUS_LABELS[nextStatus] : "—"}</strong>. Esta acción
              quedará registrada en la bitácora.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p><span className="font-semibold">Fila:</span> {selected?.fila ?? "—"}</p>
            <p><span className="font-semibold">Letra:</span> {selected?.letra ?? "—"}</p>
            <p><span className="font-semibold">Descripción:</span> {reason.trim()}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void updateStatus()} disabled={saving}>
              {saving ? "Actualizando..." : "Confirmar cambio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {selected?.vueloAsientoId && (
        <EmergencySaleDialog
          key={`${selected.id}-${isSaleDialogOpen ? "open" : "closed"}`}
          open={isSaleDialogOpen && !closedFlight}
          vueloId={Number(vueloId)}
          flightNumber={flight?.numero_vuelo || flight?.numeroVuelo || `Vuelo ${vueloId}`}
          seatId={selected.vueloAsientoId}
          seatLabel={`Asiento ${selected.numero}`}
          seatClass={typeNames.get(selected.tipoAsientoId) ?? "Sin clase"}
          price={selected.precio ?? 0}
          onOpenChange={handleSaleDialogOpenChange}
          onReleased={handleSaleReleased}
          onCompleted={handleSaleCompleted}
          onError={handleSaleError}
        />
      )}
    </div>
  );
}

function CabinGrid({
  rows,
  seatsByRow,
  selectedId,
  onSelect,
}: {
  rows: number[];
  seatsByRow: Record<number, DispatchSeat[]>;
  selectedId?: number;
  onSelect: (seat: DispatchSeat) => void;
}) {
  const columns = Array.from(
    new Set(Object.values(seatsByRow).flat().map((seat) => seat.letra)),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="mx-auto flex max-w-3xl justify-center rounded-xl bg-slate-100/70 p-2 sm:p-3">
      <div className="w-full rounded-[1.5rem] border-2 border-slate-200 bg-slate-50 p-2 shadow-inner sm:p-3">
        <div className="mx-auto flex h-10 w-[62%] items-center justify-center rounded-t-[4rem] border-x-2 border-t-2 border-slate-300 bg-white font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          Cabina
        </div>
        <div className="mb-2 flex flex-wrap items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px]">
          <span className="mr-1 font-semibold text-muted-foreground">Columnas:</span>
          {columns.map((column) => (
            <span
              key={column}
              className="size-6 rounded border border-border text-center font-mono text-[11px] font-semibold leading-6 text-muted-foreground"
            >
              {column}
            </span>
          ))}
        </div>
        <div className="max-h-[calc(100vh-18rem)] min-h-[280px] overflow-y-auto rounded-b-[1.5rem] border-2 border-slate-200 bg-white px-2 py-2 sm:px-3">
          <div className="mb-1 grid grid-cols-[1fr_36px_1fr] text-center font-mono text-[10px] text-muted-foreground">
            <span>VENTANA</span>
            <span>PASILLO</span>
            <span>VENTANA</span>
          </div>
          {rows.map((row) => {
            const rowSeats = [...(seatsByRow[row] ?? [])].sort((a, b) =>
              a.letra.localeCompare(b.letra),
            );
            const split = Math.ceil(rowSeats.length / 2);
            return (
              <div key={row} className="cursor-pointer">
                <div className="grid grid-cols-[1fr_36px_1fr] items-center gap-1 border-b border-slate-100 py-1 last:border-b-0">
                  <SeatGroup
                    seats={rowSeats.slice(0, split)}
                    selectedId={selectedId}
                    onSelect={onSelect}
                  />
                  <div className="flex w-8 items-center justify-center">
                    <span className="size-7 rounded border border-border bg-slate-50 text-center font-mono text-[10px] leading-7 text-muted-foreground">
                      {row}
                    </span>
                  </div>
                  <SeatGroup
                    seats={rowSeats.slice(split)}
                    selectedId={selectedId}
                    onSelect={onSelect}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SeatGroup({
  seats,
  selectedId,
  onSelect,
}: {
  seats: DispatchSeat[];
  selectedId?: number;
  onSelect: (seat: DispatchSeat) => void;
}) {
  return (
    <div
      className="grid justify-items-center gap-1"
      style={{
        gridTemplateColumns: `repeat(${Math.max(seats.length, 1)}, minmax(0, 1fr))`,
      }}
    >
      {seats.map((seat) => (
        <SeatButton
          key={seat.id}
          seat={seat}
          selected={selectedId === seat.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function SeatButton({
  seat,
  selected,
  onSelect,
}: {
  seat: DispatchSeat;
  selected: boolean;
  onSelect: (seat: DispatchSeat) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(seat)}
      aria-label={`Fila ${seat.fila}, letra ${seat.letra}, ${STATUS_LABELS[seat.estado]}`}
      className={`flex size-9 min-h-9 items-center justify-center rounded-md border text-xs font-medium transition-all hover:ring-2 hover:ring-primary ${
        STATUS_STYLES[seat.estado]
      } ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
    >
      {seat.numero}
    </button>
  );
}
