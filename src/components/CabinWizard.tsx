import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Armchair, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  createCabinBulk,
  formatCabin,
  type CreateSeatDTO,
} from "@/services/seatService";

export interface CabinSeatType {
  id: number;
  nombre: string;
}

export interface CabinWizardProps {
  avionId: number;
  capacidadAvion: number;
  tiposAsiento: CabinSeatType[];
  onSuccess: () => void;
  hasExistingSeats?: boolean;
  triggerLabel?: string;
}

const DISTRIBUTIONS = {
  "2-2": ["A", "B", "C", "D"],
  "3-3": ["A", "B", "C", "D", "E", "F"],
} as const;

type Distribution = keyof typeof DISTRIBUTIONS;

export default function CabinWizard({
  avionId,
  capacidadAvion,
  tiposAsiento,
  onSuccess,
  hasExistingSeats = false,
  triggerLabel = "Configurar cabina",
}: CabinWizardProps) {
  const [distribucion, setDistribucion] = useState<Distribution>("2-2");
  const [filasPorClase, setFilasPorClase] = useState<Record<number, number>>(
    () => Object.fromEntries(tiposAsiento.map(({ id }) => [id, 0])),
  );
  const [isFormatting, setIsFormatting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setFilasPorClase((current) =>
      Object.fromEntries(
        tiposAsiento.map(({ id }) => [id, current[id] ?? 0]),
      ),
    );
  }, [tiposAsiento]);

  const letras = DISTRIBUTIONS[distribucion];
  const asientosPorFila = letras.length;
  const totalOcupados = useMemo(
    () =>
      tiposAsiento.reduce(
        (total, { id }) => total + (filasPorClase[id] ?? 0) * asientosPorFila,
        0,
      ),
    [asientosPorFila, filasPorClase, tiposAsiento],
  );
  const disponibles = capacidadAvion - totalOcupados;
  const canSave = totalOcupados > 0 && totalOcupados <= capacidadAvion;

  const updateRows = (tipoAsientoId: number, value: string) => {
    const rows = Math.max(0, Number.parseInt(value, 10) || 0);
    setFilasPorClase((current) => ({ ...current, [tipoAsientoId]: rows }));
  };

  const handleFormat = async () => {
    setNotice("");
    setIsFormatting(true);
    try {
      await formatCabin(avionId);
      onSuccess();
    } catch (err) {
      console.error(err);
      setNotice("No se pudo formatear la cabina");
    } finally {
      setIsFormatting(false);
    }
  };

  const handleSave = async () => {
    if (!canSave || isSaving) return;

    setNotice("");
    setIsSaving(true);
    try {
      const payload: CreateSeatDTO[] = [];
      let filaGlobal = 1;

      for (const { id: claseActiva } of tiposAsiento.slice(0, 3)) {
        const filas = filasPorClase[claseActiva] ?? 0;
        for (let fila = 0; fila < filas; fila += 1) {
          for (const letra of letras) {
            payload.push({
              avionId,
              tipoAsientoId: claseActiva,
              numero: `${filaGlobal}${letra}`,
              fila: filaGlobal,
              letra,
            });
          }
          filaGlobal += 1;
        }
      }

      if (hasExistingSeats) await formatCabin(avionId);
      await createCabinBulk(payload);
      onSuccess();
    } catch (err) {
      console.error(err);
      setNotice("No se pudo guardar la cabina");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Armchair />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Generar cabina física</SheetTitle>
          <SheetDescription>
            Define la distribución y las filas de cada clase para el avión.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 py-6">
          <label className="grid gap-2 text-sm font-medium">
            Distribución transversal
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={distribucion}
              onChange={(event) =>
                setDistribucion(event.target.value as Distribution)
              }
            >
              <option value="2-2">2-2 · 4 asientos por fila</option>
              <option value="3-3">3-3 · 6 asientos por fila</option>
            </select>
          </label>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Filas por clase</h3>
              <p className="text-xs text-muted-foreground">
                Cada fila genera {asientosPorFila} asientos ({letras.join(", ")}).
              </p>
            </div>
            {tiposAsiento.slice(0, 3).map((tipo) => (
              <label key={tipo.id} className="grid gap-2 text-sm font-medium">
                {tipo.nombre}
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={filasPorClase[tipo.id] ?? 0}
                  onChange={(event) => updateRows(tipo.id, event.target.value)}
                />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Capacidad</div>
              <div className="font-mono text-lg font-semibold">{capacidadAvion}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Ocupados</div>
              <div className="font-mono text-lg font-semibold">{totalOcupados}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Disponibles</div>
              <div className={`font-mono text-lg font-semibold ${disponibles < 0 ? "text-destructive" : ""}`}>
                {disponibles}
              </div>
            </div>
          </div>

          {notice && (
            <p className="text-sm text-destructive" role="alert">
              {notice}
            </p>
          )}

          {hasExistingSeats && (
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={handleFormat}
              disabled={isFormatting || isSaving}
            >
              {isFormatting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {isFormatting ? "Formateando..." : "Formatear Cabina"}
            </Button>
          )}

          {!canSave && totalOcupados > capacidadAvion && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              La cantidad de asientos supera la capacidad del avión.
            </p>
          )}
        </div>

        <SheetFooter>
          <Button
            type="button"
            className="w-full"
            onClick={handleSave}
            disabled={!canSave || isSaving || isFormatting}
          >
            {isSaving && <Loader2 className="animate-spin" />}
            {isSaving ? "Guardando..." : "Guardar cabina"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}