import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getFlights, type Flight } from "@/services/flightService";
import { getPlanes, type Plane } from "@/services/planeService";
import { getSeatsByPlane, type Seat } from "@/services/seatService";
import { getSeatTypes, type SeatType } from "@/services/seatTypeService";
import {
  getVueloAsientos,
  initVueloAsientos,
  updateBulkPrice,
  type VueloAsiento,
  type VueloSeatStatus,
} from "@/services/vueloAsientoService";

const TYPE_COLORS = [
  "border-blue-900 bg-blue-900 text-white",
  "border-emerald-500 bg-emerald-100 text-emerald-900",
  "border-orange-500 bg-orange-100 text-orange-900",
  "border-purple-500 bg-purple-100 text-purple-900",
  "border-teal-500 bg-teal-100 text-teal-900",
  "border-rose-500 bg-rose-100 text-rose-900",
];

const COMMERCIAL_STATUS: Record<VueloSeatStatus, string> = {
  DISPONIBLE: "border-transparent",
  BLOQUEADO: "border-bad/30 bg-bad-bg text-bad",
  CONFIRMADO: "border-gray-500 bg-gray-500 text-white",
};

type CommercialSeat = Seat & {
  precio: number | null;
  estadoComercial: VueloSeatStatus;
};

const errorMessage = (cause: unknown) =>
  cause instanceof Error
    ? cause.message
    : "No se pudo cargar el mapa de precios.";

const formatCurrency = (value: number | null) =>
  value === null
    ? "Sin asignar"
    : new Intl.NumberFormat("es-GT", {
        style: "currency",
        currency: "USD",
      }).format(value);

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("es-GT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Sin fecha";

export default function FlightPricingMap() {
  const { vueloId } = useParams<{ vueloId: string }>();
  const parsedVueloId = Number(vueloId);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [plane, setPlane] = useState<Plane | null>(null);
  const [seatTypes, setSeatTypes] = useState<SeatType[]>([]);
  const [commercialSeats, setCommercialSeats] = useState<CommercialSeat[]>([]);
  const [vueloAsientos, setVueloAsientos] = useState<VueloAsiento[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const mergeSeats = (physicalSeats: Seat[], commercial: VueloAsiento[]) => {
    return physicalSeats.map((seat) => {
      const commercialSeat = commercial.find(
        (va: any) => va.asientoId === seat.id || va.asiento_id === seat.id,
      );
      return {
        ...seat,
        precio: commercialSeat?.precio ?? null,
        estadoComercial: commercialSeat?.estado ?? "DISPONIBLE",
      };
    });
  };

  const loadInventory = async () => {
    if (!Number.isInteger(parsedVueloId) || parsedVueloId <= 0) {
      setError("El identificador del vuelo no es válido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [loadedFlights, loadedPlanes] = await Promise.all([
        getFlights(),
        getPlanes(),
      ]);
      const loadedFlight = loadedFlights.find(
        (item) => item.id === parsedVueloId,
      );
      const loadedPlane = loadedPlanes.find(
        (item) => item.id === loadedFlight?.avionId,
      );

      if (!loadedFlight || !loadedPlane) {
        setError("No se encontró el vuelo o la aeronave asociada.");
        setCommercialSeats([]);
        setVueloAsientos([]);
        return;
      }

      const [loadedSeatTypes, physicalSeats, loadedCommercialSeats] =
        await Promise.all([
          getSeatTypes(),
          getSeatsByPlane(loadedPlane.id),
          getVueloAsientos(parsedVueloId),
        ]);
      setFlight(loadedFlight);
      setPlane(loadedPlane);
      setSeatTypes(loadedSeatTypes);
      setVueloAsientos(loadedCommercialSeats);
      setCommercialSeats(mergeSeats(physicalSeats, loadedCommercialSeats));
      setSelectedIds([]);
      setPrice("");
    } catch (cause) {
      setError(errorMessage(cause));
      setCommercialSeats([]);
      setVueloAsientos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, [vueloId]);

  const typeNames = useMemo(
    () => new Map(seatTypes.map((type) => [type.id, type.nombre])),
    [seatTypes],
  );
  const rows = useMemo(
    () =>
      Array.from(new Set(commercialSeats.map((seat) => seat.fila))).sort(
        (a, b) => a - b,
      ),
    [commercialSeats],
  );
  const seatsByRow = useMemo(
    () =>
      commercialSeats.reduce<Record<number, CommercialSeat[]>>((result, seat) => {
        (result[seat.fila] ??= []).push(seat);
        return result;
      }, {}),
    [commercialSeats],
  );
  const selected = commercialSeats.filter((seat) =>
    selectedIds.includes(seat.id),
  );
  const statusCounts = commercialSeats.reduce<Record<string, number>>(
    (result, seat) => {
      result[seat.estadoComercial] = (result[seat.estadoComercial] ?? 0) + 1;
      return result;
    },
    {},
  );
  const typeCounts = commercialSeats.reduce<Record<number, number>>(
    (result, seat) => {
      result[seat.tipoAsientoId] = (result[seat.tipoAsientoId] ?? 0) + 1;
      return result;
    },
    {},
  );
  const validPrice = Number(price) > 0;

  const selectSeats = (seatIds: number[]) => {
    const availableIds = seatIds.filter((id) => {
      const seat = commercialSeats.find((item) => item.id === id);
      return seat?.estadoComercial === "DISPONIBLE";
    });
    const allSelected = availableIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !availableIds.includes(id))
        : Array.from(new Set([...current, ...availableIds])),
    );
  };

  const toggleSeat = (seat: CommercialSeat) => {
    if (seat.estadoComercial !== "DISPONIBLE") return;
    setSelectedIds((current) =>
      current.includes(seat.id)
        ? current.filter((id) => id !== seat.id)
        : [...current, seat.id],
    );
  };

  const applyPrice = async () => {
    if (!Number.isInteger(parsedVueloId) || selectedIds.length === 0 || !validPrice)
      return;
    setIsSaving(true);
    setError("");
    try {
      await updateBulkPrice(Number(vueloId), selectedIds, Number(price));
      const refreshedCommercialSeats = await getVueloAsientos(parsedVueloId);
      setVueloAsientos(refreshedCommercialSeats);
      setCommercialSeats((current) => {
        return current.map((seat) => {
          const commercial = refreshedCommercialSeats.find(
            (va: any) => va.asientoId === seat.id || va.asiento_id === seat.id,
          );
          return {
            ...seat,
            precio: commercial?.precio ?? seat.precio,
            estadoComercial: commercial?.estado ?? seat.estadoComercial,
          };
        });
      });
      setSelectedIds([]);
      setPrice("");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  };

  const initializeInventory = async () => {
    if (!Number.isInteger(parsedVueloId)) return;
    setIsSaving(true);
    setError("");
    try {
      await initVueloAsientos(parsedVueloId);
      await loadInventory();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TooltipProvider>
      <div>
        <Link
          className="mb-6 flex items-center text-sm text-muted-foreground hover:text-foreground hover:underline"
          to="/vuelos"
        >
          ← Volver a vuelos
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Precios del vuelo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define la rentabilidad por asiento para este vuelo.
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-md border border-bad/30 bg-bad-bg px-3 py-2 text-sm text-bad">
            {error}
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="min-w-0 rounded-xl">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>{flight?.numeroVuelo ?? "Vuelo"}</CardTitle>
                  <CardDescription className="mt-1">
                    Ruta {flight?.rutaId ?? "—"} · {plane?.matricula ?? "Sin aeronave"} · {formatDate(flight?.fechaSalida)}
                  </CardDescription>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {commercialSeats.length} / {plane?.capacidad ?? 0} asientos
                </span>
              </div>
              <CardDescription className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                {(["DISPONIBLE", "BLOQUEADO", "CONFIRMADO"] as VueloSeatStatus[]).map(
                  (status) => (
                    <span key={status} className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`size-3.5 rounded-sm p-0 ${COMMERCIAL_STATUS[status].split(" ").slice(0, 2).join(" ")}`}
                      />
                      {status[0] + status.slice(1).toLowerCase()} {" "}
                      <span className="font-mono">{statusCounts[status] ?? 0}</span>
                    </span>
                  ),
                )}
                {seatTypes.map((type) => (
                  <span key={type.id} className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`size-3.5 rounded-sm p-0 ${TYPE_COLORS[type.id % TYPE_COLORS.length].split(" ").slice(0, 2).join(" ")}`}
                    />
                    {type.nombre} {" "}
                    <span className="font-mono">{typeCounts[type.id] ?? 0}</span>
                  </span>
                ))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Cargando inventario...
                </p>
              ) : vueloAsientos.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                  <h3 className="mb-2 text-lg font-semibold">Inventario no inicializado</h3>
                  <p className="mb-6 max-w-md text-sm text-muted-foreground">
                    Este vuelo aún no tiene sus asientos comerciales generados en la base de datos.
                  </p>
                  <Button onClick={initializeInventory} disabled={isSaving}>
                    {isSaving ? "Generando..." : "Generar Inventario Comercial"}
                  </Button>
                </div>
              ) : (
                <CabinGrid
                  rows={rows}
                  seatsByRow={seatsByRow}
                  typeNames={typeNames}
                  selectedIds={selectedIds}
                  onToggle={toggleSeat}
                  onSelect={selectSeats}
                />
              )}
            </CardContent>
          </Card>
          <Card className="order-first h-fit rounded-xl lg:sticky lg:top-0 lg:order-last">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
                Selección
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selected.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Selecciona asientos para asignarles un precio.
                </p>
              ) : selected.length === 1 ? (
                <div>
                  <div className="mb-4 flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-medium">1</span>
                    <span className="text-sm text-muted-foreground">asiento seleccionado</span>
                  </div>
                  <div className="mb-4 rounded-md bg-muted/50 p-3 text-xs">
                    <p><span className="font-semibold">Fila:</span> {selected[0].fila}</p>
                    <p><span className="font-semibold">Letra:</span> {selected[0].letra}</p>
                    <p><span className="font-semibold">Clase:</span> {typeNames.get(selected[0].tipoAsientoId) ?? "Sin clase"}</p>
                    <p><span className="font-semibold">Estado:</span> {selected[0].estadoComercial}</p>
                    <p><span className="font-semibold">Precio actual:</span> {selected[0].precio !== undefined && selected[0].precio !== null ? "$" + selected[0].precio : "Sin asignar"}</p>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-medium">{selected.length}</span>
                    <span className="text-sm text-muted-foreground">asientos seleccionados</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selected.map((seat) => seat.letra).join(", ")}
                  </p>
                </div>
              )}
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="$ Nuevo precio"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                disabled={selected.length === 0}
              />
              <Button
                className="mt-4 w-full"
                onClick={applyPrice}
                disabled={isSaving || selected.length === 0 || !validPrice}
              >
                {isSaving ? "Aplicando..." : "Aplicar"}
              </Button>
              <button
                type="button"
                className="mt-3 w-full text-xs text-muted-foreground underline disabled:no-underline"
                onClick={() => setSelectedIds([])}
                disabled={selected.length === 0}
              >
                Limpiar selección
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

function CabinGrid({
  rows,
  seatsByRow,
  typeNames,
  selectedIds,
  onToggle,
  onSelect,
}: {
  rows: number[];
  seatsByRow: Record<number, CommercialSeat[]>;
  typeNames: Map<number, string>;
  selectedIds: number[];
  onToggle: (seat: CommercialSeat) => void;
  onSelect: (seatIds: number[]) => void;
}) {
  return (
    <div className="flex justify-center rounded-lg bg-background px-2 py-6">
      <div className="w-full max-w-[560px]">
        <div className="mx-auto h-14 w-[70%] rounded-t-full border-x-2 border-t-2 border-border bg-card text-center font-mono text-[10px] uppercase tracking-widest leading-[3.5rem] text-muted-foreground">
          Cabina
        </div>
        <div className="max-h-[560px] overflow-y-auto border-x-2 border-border bg-card px-3 py-3 sm:px-6">
          <div className="mb-2 grid grid-cols-[1fr_44px_1fr] text-center font-mono text-[11px] text-muted-foreground">
            <span>VENTANA</span>
            <span>PASILLO</span>
            <span>VENTANA</span>
          </div>
          {rows.map((row, rowIndex) => {
            const rowSeats = [...(seatsByRow[row] ?? [])].sort((a, b) =>
              a.letra.localeCompare(b.letra),
            );
            const split = Math.ceil(rowSeats.length / 2);
            const left = rowSeats.slice(0, split);
            const right = rowSeats.slice(split);
            const typeId = rowSeats[0]?.tipoAsientoId;
            const typeName = typeNames.get(typeId ?? 0) ?? "Sin clase";
            const previousTypeId = seatsByRow[rows[rowIndex - 1]]?.[0]?.tipoAsientoId;
            return (
              <div key={row} className="cursor-pointer">
                {(rowIndex === 0 || previousTypeId !== typeId) && (
                  <div className="my-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => onSelect(
                        Object.values(seatsByRow)
                          .flat()
                          .filter((seat) => seat.tipoAsientoId === typeId)
                          .map((seat) => seat.id),
                      )}
                      className="hover:text-foreground hover:underline"
                    >
                      {typeName}
                    </button>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}
                <div className="grid grid-cols-[1fr_44px_1fr] items-center gap-1 py-1">
                  <SeatGroup
                    seats={left}
                    typeNames={typeNames}
                    selectedIds={selectedIds}
                    onToggle={onToggle}
                  />
                  <div className="flex w-8 items-center justify-center">
                    <button
                      type="button"
                      onClick={() => onSelect(rowSeats.map((seat) => seat.id))}
                      className="font-mono text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {row}
                    </button>
                  </div>
                  <SeatGroup
                    seats={right}
                    typeNames={typeNames}
                    selectedIds={selectedIds}
                    onToggle={onToggle}
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
  typeNames,
  selectedIds,
  onToggle,
}: {
  seats: CommercialSeat[];
  typeNames: Map<number, string>;
  selectedIds: number[];
  onToggle: (seat: CommercialSeat) => void;
}) {
  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateColumns: `repeat(${Math.max(seats.length, 1)}, minmax(0, 1fr))`,
      }}
    >
      {seats.map((seat) => (
        <SeatButton
          key={seat.id}
          seat={seat}
          typeName={typeNames.get(seat.tipoAsientoId) ?? "Sin clase"}
          selected={selectedIds.includes(seat.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

function SeatButton({
  seat,
  typeName,
  selected,
  onToggle,
}: {
  seat: CommercialSeat;
  typeName: string;
  selected: boolean;
  onToggle: (seat: CommercialSeat) => void;
}) {
  const tone = TYPE_COLORS[seat.tipoAsientoId % TYPE_COLORS.length];
  const disabled = seat.estadoComercial !== "DISPONIBLE";
  const seatClass = disabled
    ? COMMERCIAL_STATUS[seat.estadoComercial]
    : `${tone} ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => onToggle(seat)}
          aria-label={`${seat.numero}, ${typeName}, ${seat.estadoComercial}, ${formatCurrency(seat.precio)}`}
          className={`flex aspect-square size-8 min-h-8 rounded-t-md rounded-b-sm border text-[10px] font-medium transition-all hover:bg-transparent sm:size-9 ${seatClass}`}
        >
          {selected && <Check className="size-3" />}
          {seat.numero}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="grid gap-0.5 text-xs">
          <span className="font-medium">{seat.numero} · {typeName}</span>
          <span>{seat.estadoComercial}</span>
          <span>{formatCurrency(seat.precio)}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
