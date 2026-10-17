import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPlanes, type Plane } from "@/services/planeService";
import { getSeatTypes, type SeatType } from "@/services/seatTypeService";
import {
  createCabinBulk,
  formatCabin,
  type CreateSeatDTO,
} from "@/services/seatService";

interface RowBlock {
  id: string;
  startRow: number;
  endRow: number;
  seatTypeId: string;
}

const steps = [
  "Distribución transversal",
  "Segmentación de filas",
  "Previsualización y Generación",
];
const layoutOptions = ["2-2", "3-3", "2-4-2", "3-3-3"];
const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export default function CabinWizardPage() {
  const navigate = useNavigate();
  const { avionId } = useParams<{ avionId: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [columnLayout, setColumnLayout] = useState<string>("");
  const [rowBlocks, setRowBlocks] = useState<RowBlock[]>([]);
  const [airplane, setAirplane] = useState<Plane | null>(null);
  const [seatTypes, setSeatTypes] = useState<SeatType[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [planes, types] = await Promise.all([getPlanes(), getSeatTypes()]);
        setAirplane(planes.find((plane) => plane.id === Number(avionId)) ?? null);
        setSeatTypes(types);
      } catch {
        setNotice("No se pudieron cargar los datos de la cabina.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [avionId]);

  const columns = columnLayout
    ? columnLayout.split("-").reduce((total, value) => total + Number(value), 0)
    : 0;
  const configuredSeats = rowBlocks.reduce(
    (total, block) =>
      total + Math.max(0, block.endRow - block.startRow + 1) * columns,
    0,
  );
  const remainingSeats = (airplane?.capacidad ?? 0) - configuredSeats;
  const hasOverlap = rowBlocks.some((block, index) =>
    rowBlocks.some(
      (other, otherIndex) =>
        index !== otherIndex &&
        block.startRow <= other.endRow &&
        block.endRow >= other.startRow,
    ),
  );
  const invalidBlock = rowBlocks.some(
    (block) => block.startRow < 1 || block.endRow < block.startRow || !block.seatTypeId,
  );
  const typeNames = useMemo(
    () => Object.fromEntries(seatTypes.map((type) => [String(type.id), type.nombre])),
    [seatTypes],
  );
  const canContinue =
    currentStep === 1
      ? Boolean(columnLayout)
      : rowBlocks.length > 0 && !hasOverlap && !invalidBlock && remainingSeats >= 0;

  const addBlock = () => {
    setRowBlocks((blocks) => [
      ...blocks,
      {
        id: crypto.randomUUID(),
        startRow: blocks.length ? blocks[blocks.length - 1].endRow + 1 : 1,
        endRow: blocks.length ? blocks[blocks.length - 1].endRow + 1 : 1,
        seatTypeId: seatTypes[0] ? String(seatTypes[0].id) : "",
      },
    ]);
  };
  const updateBlock = (id: string, changes: Partial<RowBlock>) => {
    setRowBlocks((blocks) =>
      blocks.map((block) => (block.id === id ? { ...block, ...changes } : block)),
    );
  };
  const handleGenerateSeats = async () => {
    if (!airplane || !columns || generating) return;

    setNotice("");
    setGenerating(true);
    try {
      const seatLetters = Array.from({ length: columns }, (_, index) =>
        String.fromCharCode(65 + index),
      );
      const payload: CreateSeatDTO[] = [];

      for (const block of rowBlocks) {
        for (let row = block.startRow; row <= block.endRow; row += 1) {
          for (const letter of seatLetters) {
            payload.push({
              avionId: airplane.id,
              tipoAsientoId: Number(block.seatTypeId),
              numero: `${row}${letter}`,
              fila: row,
              letra: letter,
            });
          }
        }
      }

      await formatCabin(airplane.id);
      await createCabinBulk(payload);
      navigate("/flota/mapa-asientos");
    } catch (cause) {
      console.error(cause);
      setNotice(
        cause instanceof Error
          ? cause.message
          : "No se pudo generar la cabina.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate("/flota/mapa-asientos")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a mapa de asientos
      </button>
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Configurar Matriz de Cabina
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Define la distribución y las clases de la cabina antes de generarla.
      </p>
      <ol className="mt-6 flex items-center">
        {steps.map((label, index) => (
          <li key={label} className={`flex items-center ${index < 2 ? "flex-1" : ""}`}>
            <button
              disabled={index + 1 > currentStep}
              onClick={() => setCurrentStep(index + 1)}
              className="flex items-center gap-2.5 disabled:cursor-default"
            >
              <span
                className={`flex size-8 items-center justify-center rounded-full font-mono text-sm font-medium ${index + 1 < currentStep ? "bg-ok text-white" : index + 1 === currentStep ? "bg-primary text-white" : "border border-border bg-card text-muted-foreground"}`}
              >
                {index + 1 < currentStep ? <Check className="size-4" /> : index + 1}
              </span>
              <span className={`hidden text-sm sm:block ${index + 1 === currentStep ? "font-semibold" : "text-muted-foreground"}`}>
                {label}
              </span>
            </button>
            {index < 2 && <span className={`mx-3 h-px flex-1 ${index + 1 < currentStep ? "bg-ok" : "bg-border"}`} />}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:hidden">
        Paso {currentStep} de 3 · {steps[currentStep - 1]}
      </p>
      {notice && <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{notice}</div>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="rounded-xl">
          <CardContent className="p-5 md:p-7">
            {loading ? (
              <p className="py-12 text-center text-muted-foreground">Cargando catálogos...</p>
            ) : !airplane ? (
              <p className="py-12 text-center text-destructive">No se encontró la aeronave solicitada.</p>
            ) : (
              <>
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div><h2 className="text-lg font-semibold">Distribución transversal</h2><p className="text-sm text-muted-foreground">Selecciona cuántos asientos tendrá cada fila.</p></div>
                    <label className="grid gap-1.5 text-sm font-medium">Layout de cabina
                      <select className={inputClass} value={columnLayout} onChange={(event) => setColumnLayout(event.target.value)}>
                        <option value="">Selecciona una distribución...</option>
                        {layoutOptions.map((layout) => <option key={layout} value={layout}>{layout} ({layout.split("-").reduce((sum, value) => sum + Number(value), 0)} asientos/fila)</option>)}
                      </select>
                    </label>
                    <p className="text-xs text-muted-foreground">La configuración elegida equivale a {columns || "—"} columnas por fila.</p>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Segmentación por bloques</h2><p className="text-sm text-muted-foreground">Asigna un tipo de asiento a cada tramo de filas.</p></div><Button variant="outline" onClick={addBlock}><Plus className="size-4" /> Añadir bloque de filas</Button></div>
                    <div className="grid gap-3">
                      {rowBlocks.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Añade el primer bloque de filas para comenzar.</p>}
                      {rowBlocks.map((block) => (
                        <div key={block.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_1.5fr_auto] sm:items-end">
                          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fila inicio<Input type="number" min={1} value={block.startRow} onChange={(event) => updateBlock(block.id, { startRow: Number(event.target.value) })} /></label>
                          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fila fin<Input type="number" min={1} value={block.endRow} onChange={(event) => updateBlock(block.id, { endRow: Number(event.target.value) })} /></label>
                          <label className="grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo de asiento<select className={inputClass} value={block.seatTypeId} onChange={(event) => updateBlock(block.id, { seatTypeId: event.target.value })}><option value="">Selecciona un tipo...</option>{seatTypes.map((type) => <option key={type.id} value={type.id}>{type.nombre}</option>)}</select></label>
                          <Button variant="ghost" size="icon" aria-label="Eliminar bloque" onClick={() => setRowBlocks((blocks) => blocks.filter((item) => item.id !== block.id))}><Trash className="size-4 text-destructive" /></Button>
                        </div>
                      ))}
                    </div>
                    {(hasOverlap || invalidBlock) && <p className="text-sm text-destructive">Revisa que las filas sean válidas y no se solapen.</p>}
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div><h2 className="text-lg font-semibold">Previsualización y generación</h2><p className="text-sm text-muted-foreground">Confirma la distribución antes de sobrescribir la cabina.</p></div>
                    <div className="divide-y rounded-lg border">{rowBlocks.map((block) => <div key={block.id} className="flex items-center justify-between gap-4 p-4 text-sm"><span>Fila {block.startRow} a {block.endRow}: <strong>{typeNames[block.seatTypeId] ?? "Sin tipo"}</strong></span><span className="font-mono text-muted-foreground">{(block.endRow - block.startRow + 1) * columns} asientos</span></div>)}</div>
                    <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">Esta acción sobrescribirá la cabina actual del avión.</p>
                  </div>
                )}
                <div className="mt-8 flex items-center justify-between border-t border-border pt-5"><Button variant="ghost" onClick={() => currentStep === 1 ? navigate("/flota/mapa-asientos") : setCurrentStep(currentStep - 1)}>{currentStep === 1 ? "Cancelar" : <><ArrowLeft className="size-4" /> Atrás</>}</Button>{currentStep < 3 ? <Button disabled={!canContinue} onClick={() => setCurrentStep(currentStep + 1)}>Continuar <ArrowRight className="size-4" /></Button> : <Button disabled={generating} onClick={handleGenerateSeats}>{generating ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{generating ? "Generando..." : "Generar Cabina"}</Button>}</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="h-fit rounded-xl lg:sticky lg:top-0"><CardContent className="p-5"><h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Resumen de configuración</h3><dl className="mt-4 space-y-4 text-sm"><div className="flex justify-between gap-3 border-b border-border pb-3"><dt className="text-muted-foreground">Aeronave</dt><dd className="text-right font-mono">{airplane ? `${airplane.matricula} · ${airplane.nombre ?? "Modelo no especificado"}` : "Pendiente"}</dd></div><div className="flex justify-between gap-3 border-b border-border pb-3"><dt className="text-muted-foreground">Capacidad oficial</dt><dd className="font-mono">{airplane?.capacidad ?? 0} asientos</dd></div><div className="flex justify-between gap-3 border-b border-border pb-3"><dt className="text-muted-foreground">Layout</dt><dd className="font-mono">{columnLayout || "Pendiente"}</dd></div><div className="flex justify-between gap-3 border-b border-border pb-3"><dt className="text-muted-foreground">Configurados</dt><dd className="font-mono">{configuredSeats}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Restantes</dt><dd className={`font-mono ${remainingSeats < 0 ? "font-semibold text-destructive" : ""}`}>{remainingSeats}</dd></div></dl>{remainingSeats < 0 && <p className="mt-4 text-xs text-destructive">Has superado la capacidad oficial.</p>}</CardContent></Card>
      </div>
    </div>
  );
}