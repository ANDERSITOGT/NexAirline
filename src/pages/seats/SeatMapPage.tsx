import { useEffect, useState } from "react";
import { Lock, LockOpen, Pencil } from "lucide-react";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CabinWizard from "@/components/CabinWizard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPlanes, type Plane } from "@/services/planeService";
import { getSeatTypes, type SeatType } from "@/services/seatTypeService";
import {
  createSeat,
  getSeatsByPlane,
  updateSeat,
  type CreateSeatDTO,
  type Seat,
} from "@/services/seatService";

type SeatEstado = "DISPONIBLE" | "BLOQUEADO";
const statusStyle: Record<SeatEstado, string> = {
  DISPONIBLE: "border-ok/40 bg-ok-bg text-ok hover:border-ok",
  BLOQUEADO: "border-bad/30 bg-bad-bg text-bad hover:border-bad",
};
const TYPE_COLORS = [
  "border-blue-900 bg-blue-900 text-white",
  "border-emerald-500 bg-emerald-100 text-emerald-900",
  "border-orange-500 bg-orange-100 text-orange-900",
  "border-purple-500 bg-purple-100 text-purple-900",
  "border-teal-500 bg-teal-100 text-teal-900",
  "border-rose-500 bg-rose-100 text-rose-900",
];

export default function SeatMap() {
  const [planes, setPlanes] = useState<Plane[]>([]);
  const [seatTypes, setSeatTypes] = useState<SeatType[]>([]);
  const [selectedPlaneId, setSelectedPlaneId] = useState<number>();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [rowTypeId, setRowTypeId] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<CreateSeatDTO>({
    avionId: 0,
    tipoAsientoId: 0,
    numero: "",
    fila: 1,
    letra: "A",
  });
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getPlanes(), getSeatTypes()])
      .then(([loadedPlanes, loadedTypes]) => {
        setPlanes(loadedPlanes);
        setSeatTypes(loadedTypes);
        if (loadedPlanes[0]) setSelectedPlaneId(loadedPlanes[0].id);
      })
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar los catálogos.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (selectedPlaneId === undefined) return;
    getSeatsByPlane(selectedPlaneId)
      .then((loadedSeats) => {
        setSeats(loadedSeats);
        setSelectedIds([]);
      })
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar los asientos.",
        ),
      );
  }, [selectedPlaneId]);

  const reloadSeats = async () => {
    if (selectedPlaneId !== undefined) {
      setSeats(await getSeatsByPlane(selectedPlaneId));
      setSelectedIds([]);
    }
  };
  const plane = planes.find((item) => item.id === selectedPlaneId);
  const typeNames = Object.fromEntries(
    seatTypes.map((type) => [type.id, type.nombre]),
  );
  const rows = Array.from(new Set(seats.map((seat) => seat.fila))).sort(
    (a, b) => a - b,
  );
  const seatsByRow = seats.reduce<Record<number, Seat[]>>((result, seat) => {
    (result[seat.fila] ??= []).push(seat);
    return result;
  }, {});
  const selected = seats.filter((seat) => selectedIds.includes(seat.id));
  const counts = seats.reduce<Record<string, number>>((result, seat) => {
    const status = seat.activo ? "DISPONIBLE" : "BLOQUEADO";
    result[status] = (result[status] ?? 0) + 1;
    return result;
  }, {});
  const typeCounts = seats.reduce<Record<number, number>>((result, seat) => {
    result[seat.tipoAsientoId] = (result[seat.tipoAsientoId] ?? 0) + 1;
    return result;
  }, {});
  const openEdit = (seat: Seat) => {
    setEditingSeat(seat);
    setEditingRow(null);
    setForm({
      avionId: seat.avionId,
      tipoAsientoId: seat.tipoAsientoId,
      numero: seat.numero,
      fila: seat.fila,
      letra: seat.letra,
    });
    setError("");
    setSheetOpen(true);
  };
  const openRowEdit = (row: number) => {
    setEditingSeat(null);
    setEditingRow(row);
    setRowTypeId(
      seats.find((seat) => seat.fila === row)?.tipoAsientoId ??
        seatTypes[0]?.id ??
        0,
    );
    setError("");
    setSheetOpen(true);
  };
  const saveSeat = async () => {
    setSaving(true);
    try {
      if (editingSeat)
        await updateSeat(editingSeat.id, {
          ...form,
          activo: editingSeat.activo,
        });
      else await createSeat(form);
      await reloadSeats();
      setSheetOpen(false);
      setLog(
        [
          `${editingSeat ? "Actualizado" : "Creado"} · ${form.numero}`,
          ...log,
        ].slice(0, 3),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar el asiento.",
      );
    } finally {
      setSaving(false);
    }
  };
  const saveRow = async () => {
    if (editingRow === null || !rowTypeId) return;
    setSaving(true);
    try {
      await Promise.all(
        seats
          .filter((seat) => seat.fila === editingRow)
          .map((seat) =>
            updateSeat(seat.id, {
              avionId: seat.avionId,
              tipoAsientoId: rowTypeId,
              numero: seat.numero,
              fila: seat.fila,
              letra: seat.letra,
              activo: seat.activo,
            }),
          ),
      );
      await reloadSeats();
      setSheetOpen(false);
      setLog(
        [`Fila ${editingRow} · ${typeNames[rowTypeId]}`, ...log].slice(0, 3),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo actualizar la fila.",
      );
    } finally {
      setSaving(false);
    }
  };
  const toggleActive = async (seat: Seat) => {
    const nextActive = !seat.activo;
    setSeats((current) =>
      current.map((item) =>
        item.id === seat.id ? { ...item, activo: nextActive } : item,
      ),
    );
    try {
      await updateSeat(seat.id, {
        avionId: seat.avionId,
        tipoAsientoId: seat.tipoAsientoId,
        numero: seat.numero,
        fila: seat.fila,
        letra: seat.letra,
        activo: nextActive,
      });
    } catch (cause) {
      setSeats((current) =>
        current.map((item) =>
          item.id === seat.id ? { ...item, activo: seat.activo } : item,
        ),
      );
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo actualizar el estado.",
      );
    }
  };

  return (
    <TooltipProvider>
      <div>
        <AppBreadcrumb
          items={[{ label: "Flota", href: "/flota" }, { label: "Mapa de asientos" }]}
        />
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Mapa de asientos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Distribución de cabina e inventario de asientos por aeronave.
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
              <div className="grid gap-4 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-end">
                <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Aeronave
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground"
                    value={selectedPlaneId ?? ""}
                    onChange={(event) =>
                      setSelectedPlaneId(Number(event.target.value))
                    }
                  >
                    {planes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.matricula}
                        {item.nombre ? ` · ${item.nombre}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="font-mono text-xs text-muted-foreground">
                    {plane?.nombre ?? plane?.matricula ?? "Sin aeronave"} ·{" "}
                    {plane?.capacidad ?? 0} asientos
                  </span>
                  {plane && selectedPlaneId !== undefined && (
                    <CabinWizard
                      avionId={selectedPlaneId}
                      capacidadAvion={plane.capacidad}
                      tiposAsiento={seatTypes}
                      hasExistingSeats={seats.length > 0}
                      triggerLabel="Asignar"
                      onSuccess={async () => {
                        await reloadSeats();
                        setLog(["Cabina actualizada", ...log].slice(0, 3));
                      }}
                    />
                  )}
                  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetContent side="right" className="w-full sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle>
                          {editingRow !== null
                            ? `Editar fila ${editingRow}`
                            : "Editar asiento"}
                        </SheetTitle>
                        <SheetDescription>
                          {editingRow !== null
                            ? "Cambia la clase de todos los asientos de esta fila."
                            : "Modifica individualmente los datos de esta plaza."}
                        </SheetDescription>
                      </SheetHeader>
                      {editingRow !== null ? (
                        <RowForm
                          rowTypeId={rowTypeId}
                          setRowTypeId={setRowTypeId}
                          seatTypes={seatTypes}
                          saving={saving}
                          onSave={saveRow}
                        />
                      ) : editingSeat ? (
                        <EditForm
                          form={form}
                          setForm={setForm}
                          seatTypes={seatTypes}
                          saving={saving}
                          onSave={saveSeat}
                        />
                      ) : null}
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
              <CardDescription className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={`size-3.5 rounded-sm p-0 ${statusStyle.DISPONIBLE.split(" ").slice(0, 2).join(" ")}`}
                  />
                  Disponible{" "}
                  <span className="font-mono">{counts.DISPONIBLE ?? 0}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={`size-3.5 rounded-sm p-0 ${statusStyle.BLOQUEADO.split(" ").slice(0, 2).join(" ")}`}
                  />
                  Bloqueado{" "}
                  <span className="font-mono">{counts.BLOQUEADO ?? 0}</span>
                </span>
                {seatTypes.map((type) => (
                  <span key={type.id} className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`size-3.5 rounded-sm p-0 ${TYPE_COLORS[type.id % TYPE_COLORS.length].split(" ").slice(0, 2).join(" ")}`}
                    />
                    {type.nombre}{" "}
                    <span className="font-mono">
                      {typeCounts[type.id] ?? 0}
                    </span>
                  </span>
                ))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Cargando catálogo...
                </p>
              ) : (
                <CabinGrid
                  rows={rows}
                  seatsByRow={seatsByRow}
                  typeNames={typeNames}
                  selectedIds={selectedIds}
                  onSelect={setSelectedIds}
                  onEdit={openEdit}
                  onEditRow={openRowEdit}
                  onToggle={toggleActive}
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
                  Selecciona asientos para cambiar su estado.
                </p>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-medium">
                      {selected.length}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      asientos ·{" "}
                      {selected.map((seat) => seat.numero).join(", ")}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        Promise.all(
                          selected
                            .filter((seat) => !seat.activo)
                            .map(toggleActive),
                        )
                      }
                    >
                      <LockOpen className="size-4" /> Liberar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        Promise.all(
                          selected
                            .filter((seat) => seat.activo)
                            .map(toggleActive),
                        )
                      }
                    >
                      <Lock className="size-4" /> Bloquear
                    </Button>
                  </div>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="mt-3 text-xs text-muted-foreground underline"
                  >
                    Limpiar selección
                  </button>
                </div>
              )}
              {log.length > 0 && (
                <div className="mt-5 border-t pt-3 text-xs text-muted-foreground">
                  {log.map((entry) => (
                    <p key={entry}>{entry}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

function RowForm({
  rowTypeId,
  setRowTypeId,
  seatTypes,
  saving,
  onSave,
}: {
  rowTypeId: number;
  setRowTypeId: (id: number) => void;
  seatTypes: SeatType[];
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="mt-6 grid gap-4">
      <label className="grid gap-1.5 text-sm font-medium">
        Clase de la fila
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={rowTypeId}
          onChange={(event) => setRowTypeId(Number(event.target.value))}
        >
          {seatTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.nombre}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-muted-foreground">
        Actualiza todos los asientos de la fila seleccionada.
      </p>
      <Button onClick={onSave} disabled={saving || !rowTypeId}>
        {saving ? "Guardando..." : "Aplicar a la fila"}
      </Button>
    </div>
  );
}
function EditForm({
  form,
  setForm,
  seatTypes,
  saving,
  onSave,
}: {
  form: CreateSeatDTO;
  setForm: (form: CreateSeatDTO) => void;
  seatTypes: SeatType[];
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="mt-6 grid gap-4">
      <label className="grid gap-1.5 text-sm font-medium">
        Número
        <Input
          value={form.numero}
          onChange={(event) => setForm({ ...form, numero: event.target.value })}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-sm font-medium">
          Fila
          <Input
            type="number"
            min={1}
            value={form.fila}
            onChange={(event) =>
              setForm({ ...form, fila: Number(event.target.value) })
            }
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Letra
          <Input
            value={form.letra}
            onChange={(event) =>
              setForm({ ...form, letra: event.target.value.toUpperCase() })
            }
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        Tipo de asiento
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={form.tipoAsientoId}
          onChange={(event) =>
            setForm({ ...form, tipoAsientoId: Number(event.target.value) })
          }
        >
          {seatTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.nombre}
            </option>
          ))}
        </select>
      </label>
      <Button onClick={onSave} disabled={saving || !form.numero}>
        {saving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}

function CabinGrid({
  rows,
  seatsByRow,
  typeNames,
  selectedIds,
  onSelect,
  onEdit,
  onEditRow,
  onToggle,
}: {
  rows: number[];
  seatsByRow: Record<number, Seat[]>;
  typeNames: Record<string, string>;
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (seat: Seat) => void;
  onEditRow: (row: number) => void;
  onToggle: (seat: Seat) => void;
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
            const typeName =
              typeNames[String(rowSeats[0]?.tipoAsientoId)] ?? "Sin clase";
            const previousSeats = seatsByRow[rows[rowIndex - 1]] ?? [];
            const previousType =
              typeNames[String(previousSeats[0]?.tipoAsientoId)] ?? "";
            return (
              <div
                key={row}
                onDoubleClick={() => onEditRow(row)}
                className="cursor-pointer"
              >
                {(rowIndex === 0 || previousType !== typeName) && (
                  <div className="my-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span>{typeName}</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}
                <div className="grid grid-cols-[1fr_44px_1fr] items-center gap-1 py-1">
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(left.length, 1)}, minmax(0, 1fr))`,
                    }}
                  >
                    {left.map((seat) => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        typeName={typeNames[String(seat.tipoAsientoId)]}
                        selectedIds={selectedIds}
                        onSelect={onSelect}
                        onEdit={onEdit}
                        onToggle={onToggle}
                      />
                    ))}
                  </div>
                  <div className="flex w-8 items-center justify-center">
                    <button
                      aria-label={`Editar fila ${row}`}
                      onClick={() => onEditRow(row)}
                      className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      {row}
                    </button>
                  </div>
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(right.length, 1)}, minmax(0, 1fr))`,
                    }}
                  >
                    {right.map((seat) => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        typeName={typeNames[String(seat.tipoAsientoId)]}
                        selectedIds={selectedIds}
                        onSelect={onSelect}
                        onEdit={onEdit}
                        onToggle={onToggle}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SeatButton({
  seat,
  typeName,
  selectedIds,
  onSelect,
  onEdit,
  onToggle,
}: {
  seat: Seat;
  typeName?: string;
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  onEdit: (seat: Seat) => void;
  onToggle: (seat: Seat) => void;
}) {
  const status: SeatEstado = seat.activo ? "DISPONIBLE" : "BLOQUEADO";
  const isSelected = selectedIds.includes(seat.id);
  const tone = TYPE_COLORS[seat.tipoAsientoId % TYPE_COLORS.length];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onDoubleClick={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(
              isSelected
                ? selectedIds.filter((id) => id !== seat.id)
                : [...selectedIds, seat.id],
            );
          }}
          aria-label={`Asiento ${seat.numero} ${typeName ?? ""} ${status}`}
          className={`flex size-7 rounded-t-md rounded-b-sm border text-[10px] font-medium transition-all hover:bg-transparent sm:size-8 ${seat.activo ? tone : statusStyle.BLOQUEADO} ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
        >
          {seat.numero}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex items-center gap-2">
          {seat.numero}
          <span className="text-xs text-muted-foreground">
            {typeName ?? "Sin tipo"}
          </span>
          <button
            aria-label={`Editar ${seat.numero}`}
            onClick={() => onEdit(seat)}
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            aria-label={`${seat.activo ? "Bloquear" : "Activar"} ${seat.numero}`}
            onClick={() => onToggle(seat)}
          >
            {seat.activo ? (
              <Lock className="size-3.5" />
            ) : (
              <LockOpen className="size-3.5" />
            )}
          </button>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
