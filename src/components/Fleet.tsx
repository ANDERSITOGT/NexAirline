import { useEffect, useState, type ReactNode } from "react";
import { Armchair, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { planes as seedPlanes, type Plane } from "../data1";
import {
  mantenimientos as seedMant,
  seatTypeTotals,
  tiposAsiento as seedTipos,
  type MantEstado,
  type MantTipo,
  type Mantenimiento,
  type TipoAsiento,
} from "../data3";
import { usuarios } from "../data2";
import { createAirline, getAirlines, updateAirline, type Airline, type CreateAirlineDTO } from "../services/airlineService";

 type Tab = "aeronaves" | "aerolineas" | "mantenimiento" | "tipos";

type Option = { value: number; label: string; sub?: string; meta?: string };
type AirlineForm = Partial<CreateAirlineDTO> & { activo?: boolean; id?: number };

const tabLabels: Record<Tab, string> = {
  aeronaves: "aeronave",
  aerolineas: "aerolínea",
  mantenimiento: "mantenimiento",
  tipos: "tipo de asiento",
};

const tableCell = "p-4 align-middle";

function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  );
}

function SelectField({ options, value, onChange, placeholder }: { options: Option[]; value: number | null; onChange: (value: number | null) => void; placeholder: string }) {
  return (
    <select
      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}{option.sub ? ` · ${option.sub}` : ""}{option.meta ? ` · ${option.meta}` : ""}
        </option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />;
}

function StatusBadge({ value }: { value: string }) {
  const variant = value === "Operativa" || value === "COMPLETADO" ? "secondary" : value === "Mantenimiento" || value === "EN_CURSO" ? "default" : "outline";
  return <Badge variant={variant}>{value}</Badge>;
}

export default function Fleet() {
  const [tab, setTab] = useState<Tab>("aeronaves");
  const [planes, setPlanes] = useState(seedPlanes);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [isLoadingAirlines, setIsLoadingAirlines] = useState(true);
  const [mant, setMant] = useState(seedMant);
  const [tipos, setTipos] = useState(seedTipos);
  const [panel, setPanel] = useState<Tab | null>(null);
  const [fPlane, setFPlane] = useState<Partial<Plane>>({});
  const [fAir, setFAir] = useState<AirlineForm>({});
  const [fMant, setFMant] = useState<Partial<Mantenimiento>>({});
  const [fTipo, setFTipo] = useState<Partial<TipoAsiento>>({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadAirlines = async () => {
      try {
        setAirlines(await getAirlines());
      } catch {
        setNotice("No se pudieron cargar las aerolíneas");
      } finally {
        setIsLoadingAirlines(false);
      }
    };
    void loadAirlines();
  }, []);

  const commitPlanes = (next: Plane[]) => {
    seedPlanes.splice(0, seedPlanes.length, ...next);
    setPlanes(next);
  };
  const airName = (id: number) => airlines.find((airline) => airline.id === id)?.nombre ?? "—";
  const airOptions = airlines.filter((airline) => airline.activo).map((airline) => ({ value: airline.id, label: airline.nombre, sub: airline.pais, meta: airline.codigoIata }));
  const planeOptions = planes.filter((plane) => plane.activo).map((plane) => ({ value: plane.id, label: plane.matricula, sub: plane.modelo, meta: `${plane.capacidad} pax` }));
  const isNew = (item: { id?: number }) => !item.id;
  const openNew = () => {
    if (tab === "aeronaves") setFPlane({ activo: true });
    if (tab === "aerolineas") setFAir({ activo: true });
    if (tab === "mantenimiento") setFMant({ tipo: "PREVENTIVO", estado: "PROGRAMADO", responsable: 2, inicio: "2026-10-20", fin: "2026-10-21" });
    if (tab === "tipos") setFTipo({});
    setPanel(tab);
  };
  const upsert = <T extends { id: number }>(list: T[], update: (next: T[]) => void, item: Partial<T>) => {
    update(item.id ? list.map((current) => current.id === item.id ? { ...current, ...item } : current) : [...list, { ...item, id: Date.now() } as T]);
  };
  const valid = panel === "aeronaves"
    ? !!fPlane.aerolinea && !!fPlane.matricula && (fPlane.capacidad ?? 0) > 0
    : panel === "aerolineas"
      ? !!fAir.nombre && fAir.codigoIata?.length === 2 && fAir.codigoIcao?.length === 3 && !!fAir.pais
      : panel === "mantenimiento"
        ? !!fMant.avion && !!fMant.descripcion && !!fMant.inicio && !!fMant.fin && fMant.fin >= fMant.inicio
        : !!fTipo.nombre;
  const save = async () => {
    if (panel === "aeronaves") upsert(planes, commitPlanes, { estado: "Operativa", modelo: fPlane.modelo ?? "", ...fPlane } as Partial<Plane>);
    if (panel === "aerolineas") {
      try {
        const payload = { nombre: fAir.nombre!, codigoIata: fAir.codigoIata!, codigoIcao: fAir.codigoIcao!, pais: fAir.pais!, activo: fAir.activo };
        if (fAir.id && fAir.id > 0) {
          const updated = await updateAirline(fAir.id, payload);
          setAirlines((current) => current.map((airline) => airline.id === updated.id ? updated : airline));
        } else {
          const created = await createAirline(payload);
          setAirlines((current) => [...current, created]);
        }
      } catch {
        setNotice("No se pudo crear la aerolínea");
        return;
      }
    }
    if (panel === "mantenimiento") {
      upsert(mant, setMant, fMant);
      if (fMant.estado === "EN_CURSO") commitPlanes(planes.map((plane) => plane.id === fMant.avion ? { ...plane, estado: "Mantenimiento" } : plane));
    }
    if (panel === "tipos") upsert(tipos, setTipos, { descripcion: "", ...fTipo });
    setNotice("Cambios guardados");
    setPanel(null);
  };
  const seatCounts = seatTypeTotals(planes.filter((plane) => plane.activo));

  return (
    <div>
      <PageHeader title="Flota" subtitle="Aeronaves, aerolíneas operadoras, mantenimiento y catálogo de asientos.">
        <Button variant="default" onClick={openNew}><Plus className="size-4" /> Nueva {tabLabels[tab]}</Button>
      </PageHeader>
      {notice && <div role="status" className="mb-4 rounded-md border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm text-foreground">{notice}</div>}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Aeronaves activas", planes.filter((plane) => plane.activo).length],
          ["Operativas", planes.filter((plane) => plane.activo && plane.estado === "Operativa").length],
          ["En mantenimiento", planes.filter((plane) => plane.estado === "Mantenimiento").length],
          ["Capacidad total", planes.filter((plane) => plane.activo).reduce((total, plane) => total + plane.capacidad, 0)],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-xl">
            <CardContent className="px-4 py-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="font-mono text-2xl font-medium">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <TabsList className="h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0">
            {[
              ["aeronaves", "Aeronaves", planes.length],
              ["aerolineas", "Aerolíneas", airlines.length],
              ["mantenimiento", "Mantenimiento", mant.length],
              ["tipos", "Tipos de asiento", tipos.length],
            ].map(([value, label, count]) => (
              <TabsTrigger key={value} value={value as string} className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-accent data-[state=active]:bg-transparent">
                {label} <span className="ml-1 text-xs text-muted-foreground">{count}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {tab === "aeronaves" && (
          <Table><TableHeader><TableRow>{["Matrícula", "Aeronave", "Aerolínea", "Capacidad", "Estado operativo", "Activo", ""].map((head) => <TableHead key={head}>{head}</TableHead>)}</TableRow></TableHeader><TableBody>
            {planes.map((plane) => <TableRow key={plane.id}>
              <TableCell className={`${tableCell} font-mono font-semibold`}>{plane.matricula}</TableCell><TableCell className={tableCell}>{plane.modelo}</TableCell><TableCell className={`${tableCell} text-muted-foreground`}>{airName(plane.aerolinea)}</TableCell><TableCell className={`${tableCell} font-mono`}>{plane.capacidad}</TableCell><TableCell className={tableCell}><StatusBadge value={plane.activo ? plane.estado : "Inactivo"} /></TableCell><TableCell className={tableCell}><Toggle checked={plane.activo} onChange={() => commitPlanes(planes.map((current) => current.id === plane.id ? { ...current, activo: !current.activo } : current))} label={`Activo ${plane.matricula}`} /></TableCell><TableCell className={`${tableCell} whitespace-nowrap text-right`}><Button className="mr-1 size-8 px-0" aria-label="Ver mapa de asientos" title="Mapa de asientos"><Armchair className="size-3.5" /></Button><Button className="size-8 px-0" aria-label={`Editar ${plane.matricula}`} onClick={() => { setFPlane(plane); setPanel("aeronaves"); }}><Pencil className="size-3.5" /></Button></TableCell>
            </TableRow>)}
          </TableBody></Table>
        )}

        {tab === "aerolineas" && <Table><TableHeader><TableRow>{["Aerolínea", "IATA", "ICAO", "País", "Aeronaves", "Activa", ""].map((head) => <TableHead key={head}>{head}</TableHead>)}</TableRow></TableHeader><TableBody>{isLoadingAirlines ? <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">Cargando aerolíneas…</TableCell></TableRow> : airlines.map((airline) => <TableRow key={airline.id}><TableCell className={`${tableCell} font-medium`}>{airline.nombre}</TableCell><TableCell className={`${tableCell} font-mono`}>{airline.codigoIata}</TableCell><TableCell className={`${tableCell} font-mono`}>{airline.codigoIcao}</TableCell><TableCell className={`${tableCell} text-muted-foreground`}>{airline.pais}</TableCell><TableCell className={`${tableCell} font-mono`}>{planes.filter((plane) => plane.aerolinea === airline.id).length}</TableCell><TableCell className={tableCell}><Toggle checked={airline.activo} onChange={async (active) => { try { const updated = await updateAirline(airline.id, { ...airline, activo: active }); setAirlines((current) => current.map((item) => item.id === updated.id ? updated : item)); } catch { setNotice("No se pudo actualizar el estado de la aerolínea"); } }} label={`Activa ${airline.nombre}`} /></TableCell><TableCell className={`${tableCell} text-right`} /></TableRow>)}</TableBody></Table>}

        {tab === "mantenimiento" && <><div className="border-b border-border bg-accent/5 px-4 py-2.5 text-xs text-muted-foreground">Tabla propuesta <span className="font-mono text-foreground">Mantenimiento</span> (no existe en el esquema actual). Mientras haya una orden EN_CURSO, la aeronave no puede asignarse a vuelos nuevos.</div><Table><TableHeader><TableRow>{["Aeronave", "Tipo", "Trabajo", "Inicio", "Fin estimado", "Estado", "Responsable", ""].map((head) => <TableHead key={head}>{head}</TableHead>)}</TableRow></TableHeader><TableBody>{mant.map((maintenance) => <TableRow key={maintenance.id}><TableCell className={`${tableCell} font-mono font-semibold`}>{planes.find((plane) => plane.id === maintenance.avion)?.matricula}</TableCell><TableCell className={tableCell}><StatusBadge value={maintenance.tipo} /></TableCell><TableCell className={tableCell}>{maintenance.descripcion}</TableCell><TableCell className={`${tableCell} font-mono`}>{maintenance.inicio}</TableCell><TableCell className={`${tableCell} font-mono`}>{maintenance.fin}</TableCell><TableCell className={tableCell}><StatusBadge value={maintenance.estado} /></TableCell><TableCell className={`${tableCell} text-muted-foreground`}>{usuarios.find((user) => user.id === maintenance.responsable)?.nombre}</TableCell><TableCell className={`${tableCell} whitespace-nowrap text-right`}>{maintenance.estado === "EN_CURSO" && <Button className="mr-1 h-8" onClick={() => { setMant(mant.map((current) => current.id === maintenance.id ? { ...current, estado: "COMPLETADO" } : current)); commitPlanes(planes.map((plane) => plane.id === maintenance.avion ? { ...plane, estado: "Operativa" } : plane)); setNotice("Mantenimiento completado · aeronave operativa"); }}>Completar</Button>}<Button className="size-8 px-0" aria-label="Editar" onClick={() => { setFMant(maintenance); setPanel("mantenimiento"); }}><Pencil className="size-3.5" /></Button></TableCell></TableRow>)}</TableBody></Table></>}

        {tab === "tipos" && <Table><TableHeader><TableRow>{["Tipo de asiento", "Descripción", "Asientos en flota", ""].map((head) => <TableHead key={head}>{head}</TableHead>)}</TableRow></TableHeader><TableBody>{tipos.map((type, index) => <TableRow key={type.id}><TableCell className={`${tableCell} font-medium`}>{type.nombre}</TableCell><TableCell className={`${tableCell} text-muted-foreground`}>{type.descripcion}</TableCell><TableCell className={`${tableCell} font-mono`}>{(seatCounts[index] ?? 0).toLocaleString("en-US")}</TableCell><TableCell className={`${tableCell} text-right`}><Button className="size-8 px-0" aria-label={`Editar ${type.nombre}`} onClick={() => { setFTipo(type); setPanel("tipos"); }}><Pencil className="size-3.5" /></Button></TableCell></TableRow>)}</TableBody></Table>}
      </div>

      <Sheet open={!!panel} onOpenChange={(open) => !open && setPanel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{panel && `${panel === "aeronaves" ? isNew(fPlane) ? "Nueva" : "Editar" : panel === "aerolineas" ? isNew(fAir) ? "Nueva" : "Editar" : panel === "mantenimiento" ? isNew(fMant) ? "Nuevo" : "Editar" : isNew(fTipo) ? "Nuevo" : "Editar"} ${tabLabels[panel]}`}</SheetTitle><SheetDescription>Gestiona los datos del catálogo seleccionado.</SheetDescription></SheetHeader>
          <div className="grid gap-4 py-6">
            {panel === "aeronaves" && <><Field label="Aerolínea"><SelectField options={airOptions} value={fPlane.aerolinea ?? null} onChange={(value) => setFPlane({ ...fPlane, aerolinea: value ?? undefined })} placeholder="Seleccionar aerolínea…" /></Field><Field label="Matrícula"><input className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm" value={fPlane.matricula ?? ""} onChange={(event) => setFPlane({ ...fPlane, matricula: event.target.value.toUpperCase() })} placeholder="N-AX600" /></Field><Field label="Nombre / modelo"><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={fPlane.modelo ?? ""} onChange={(event) => setFPlane({ ...fPlane, modelo: event.target.value })} placeholder="Airbus A320neo" /></Field><Field label="Capacidad (asientos)" hint="Genera el inventario de asientos al programar vuelos."><input type="number" min={1} className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm" value={fPlane.capacidad ?? ""} onChange={(event) => setFPlane({ ...fPlane, capacidad: Number(event.target.value) })} /></Field><div className="flex items-center justify-between"><div><div className="text-sm font-medium">Aeronave activa</div><div className="text-xs text-muted-foreground">Las inactivas no aparecen al programar vuelos.</div></div><Toggle checked={!!fPlane.activo} onChange={(value) => setFPlane({ ...fPlane, activo: value })} label="Aeronave activa" /></div></>}
            {panel === "aerolineas" && <><Field label="Nombre"><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={fAir.nombre ?? ""} onChange={(event) => setFAir({ ...fAir, nombre: event.target.value })} /></Field><div className="grid grid-cols-2 gap-4"><Field label="IATA" hint="2 letras"><input maxLength={2} className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm" value={fAir.codigoIata ?? ""} onChange={(event) => setFAir({ ...fAir, codigoIata: event.target.value.toUpperCase() })} /></Field><Field label="ICAO" hint="3 letras"><input maxLength={3} className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm" value={fAir.codigoIcao ?? ""} onChange={(event) => setFAir({ ...fAir, codigoIcao: event.target.value.toUpperCase() })} /></Field></div><Field label="País"><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={fAir.pais ?? ""} onChange={(event) => setFAir({ ...fAir, pais: event.target.value })} /></Field><div className="flex items-center justify-between"><span className="text-sm font-medium">Aerolínea activa</span><Toggle checked={!!fAir.activo} onChange={(value) => setFAir({ ...fAir, activo: value })} label="Aerolínea activa" /></div></>}
            {panel === "mantenimiento" && <><Field label="Aeronave"><SelectField options={planeOptions} value={fMant.avion ?? null} onChange={(value) => setFMant({ ...fMant, avion: value ?? undefined })} placeholder="Seleccionar matrícula…" /></Field><div className="grid grid-cols-2 gap-4"><Field label="Tipo"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={fMant.tipo ?? "PREVENTIVO"} onChange={(event) => setFMant({ ...fMant, tipo: event.target.value as MantTipo })}>{["PREVENTIVO", "CORRECTIVO", "INSPECCION"].map((type) => <option key={type}>{type}</option>)}</select></Field><Field label="Estado"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={fMant.estado ?? "PROGRAMADO"} onChange={(event) => setFMant({ ...fMant, estado: event.target.value as MantEstado })}>{["PROGRAMADO", "EN_CURSO", "COMPLETADO"].map((state) => <option key={state}>{state}</option>)}</select></Field></div><Field label="Descripción del trabajo"><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={fMant.descripcion ?? ""} onChange={(event) => setFMant({ ...fMant, descripcion: event.target.value })} /></Field><div className="grid grid-cols-2 gap-4"><Field label="Inicio"><input type="date" className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm" value={fMant.inicio ?? ""} onChange={(event) => setFMant({ ...fMant, inicio: event.target.value })} /></Field><Field label="Fin estimado" hint={fMant.inicio && fMant.fin && fMant.fin < fMant.inicio ? "Debe ser posterior al inicio." : undefined}><input type="date" className="h-10 w-full rounded-md border border-input bg-background px-3 font-mono text-sm" value={fMant.fin ?? ""} onChange={(event) => setFMant({ ...fMant, fin: event.target.value })} /></Field></div><Field label="Responsable"><SelectField options={usuarios.filter((user) => user.activo).map((user) => ({ value: user.id, label: user.nombre, sub: user.correo }))} value={fMant.responsable ?? null} onChange={(value) => setFMant({ ...fMant, responsable: value ?? undefined })} placeholder="Seleccionar usuario…" /></Field></>}
            {panel === "tipos" && <><Field label="Nombre"><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={fTipo.nombre ?? ""} onChange={(event) => setFTipo({ ...fTipo, nombre: event.target.value })} /></Field><Field label="Descripción"><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={fTipo.descripcion ?? ""} onChange={(event) => setFTipo({ ...fTipo, descripcion: event.target.value })} /></Field></>}
          </div>
          <SheetFooter><Button variant="outline" onClick={() => setPanel(null)}>Cancelar</Button><Button onClick={save} disabled={!valid}>Guardar</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
