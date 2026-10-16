import { useEffect, useState, type ReactNode } from "react";
import { Armchair, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mantenimientos as seedMaintenance, seatTypeTotals, tiposAsiento as seedSeatTypes, type MantEstado, type MantTipo, type Mantenimiento, type TipoAsiento } from "../data3";
import { usuarios } from "../data2";
import { createAirline, getAirlines, updateAirline, type Airline, type CreateAirlineDTO } from "../services/airlineService";
import { createPlane, getPlanes, updatePlane, type CreatePlaneDTO, type Plane } from "../services/planeService";

type Tab = "aeronaves" | "aerolineas" | "mantenimiento" | "tipos";
type Option = { value: number; label: string; sub?: string; meta?: string };
type AirlineForm = Partial<CreateAirlineDTO> & { activo?: boolean; id?: number };
type PlaneForm = Partial<CreatePlaneDTO> & { activo?: boolean; id?: number };

const tabLabels: Record<Tab, string> = { aeronaves: "aeronave", aerolineas: "aerolínea", mantenimiento: "mantenimiento", tipos: "tipo de asiento" };
const tableCell = "p-4 align-middle";

function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>{children}</div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium"><span>{label}</span>{children}{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</label>;
}

function SelectField({ options, value, onChange, placeholder }: { options: Option[]; value: number | null; onChange: (value: number | null) => void; placeholder: string }) {
  return <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring" value={value ?? ""} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}{option.sub ? ` · ${option.sub}` : ""}{option.meta ? ` · ${option.meta}` : ""}</option>)}</select>;
}

function StatusBadge({ value }: { value: string }) {
  const variant = value === "Operativa" || value === "COMPLETADO" ? "secondary" : value === "Mantenimiento" || value === "EN_CURSO" ? "default" : "outline";
  return <Badge variant={variant}>{value}</Badge>;
}

export default function Fleet() {
  const [tab, setTab] = useState<Tab>("aeronaves");
  const [planes, setPlanes] = useState<Plane[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [isLoadingPlanes, setIsLoadingPlanes] = useState(true);
  const [isLoadingAirlines, setIsLoadingAirlines] = useState(true);
  const [maintenance, setMaintenance] = useState(seedMaintenance);
  const [seatTypes, setSeatTypes] = useState(seedSeatTypes);
  const [panel, setPanel] = useState<Tab | null>(null);
  const [planeForm, setPlaneForm] = useState<PlaneForm>({});
  const [airlineForm, setAirlineForm] = useState<AirlineForm>({});
  const [maintenanceForm, setMaintenanceForm] = useState<Partial<Mantenimiento>>({});
  const [seatTypeForm, setSeatTypeForm] = useState<Partial<TipoAsiento>>({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadFleet = async () => {
      try {
        const [loadedPlanes, loadedAirlines] = await Promise.all([getPlanes(), getAirlines()]);
        setPlanes(loadedPlanes);
        setAirlines(loadedAirlines);
      } catch {
        setNotice("No se pudo cargar la flota");
      } finally {
        setIsLoadingPlanes(false);
        setIsLoadingAirlines(false);
      }
    };
    void loadFleet();
  }, []);

  const airlineName = (id: number) => airlines.find((airline) => airline.id === id)?.nombre ?? "—";
  const airlineOptions = airlines.filter((airline) => airline.activo).map((airline) => ({ value: airline.id, label: airline.nombre, sub: airline.pais, meta: airline.codigoIata }));
  const planeOptions = planes.filter((plane) => plane.activo).map((plane) => ({ value: plane.id, label: plane.matricula, sub: plane.nombre, meta: `${plane.capacidad} pax` }));
  const planeStatus = (plane: Plane) => maintenance.some((item) => item.avion === plane.id && item.estado === "EN_CURSO") ? "Mantenimiento" : "Operativa";
  const isNew = (item: { id?: number }) => !item.id;
  const openNew = () => {
    if (tab === "aeronaves") setPlaneForm({ activo: true });
    if (tab === "aerolineas") setAirlineForm({ activo: true });
    if (tab === "mantenimiento") setMaintenanceForm({ tipo: "PREVENTIVO", estado: "PROGRAMADO", responsable: 2, inicio: "2026-10-20", fin: "2026-10-21" });
    if (tab === "tipos") setSeatTypeForm({});
    setPanel(tab);
  };
  const upsert = <T extends { id: number }>(list: T[], setter: (items: T[]) => void, item: Partial<T>) => setter(item.id ? list.map((current) => current.id === item.id ? { ...current, ...item } : current) : [...list, { ...item, id: Date.now() } as T]);
  const valid = panel === "aeronaves"
    ? !!planeForm.aerolineaId && !!planeForm.matricula && (planeForm.capacidad ?? 0) > 0
    : panel === "aerolineas"
      ? !!airlineForm.nombre && airlineForm.codigoIata?.length === 2 && airlineForm.codigoIcao?.length === 3 && !!airlineForm.pais
      : panel === "mantenimiento"
        ? !!maintenanceForm.avion && !!maintenanceForm.descripcion && !!maintenanceForm.inicio && !!maintenanceForm.fin && maintenanceForm.fin >= maintenanceForm.inicio
        : !!seatTypeForm.nombre;

  const save = async () => {
    if (panel === "aeronaves") {
      try {
        const payload = { aerolineaId: planeForm.aerolineaId!, matricula: planeForm.matricula!, nombre: planeForm.nombre, capacidad: planeForm.capacidad! };
        if (planeForm.id && planeForm.id > 0) {
          const updated = await updatePlane(planeForm.id, { ...payload, activo: !!planeForm.activo });
          setPlanes((current) => current.map((plane) => plane.id === updated.id ? updated : plane));
        } else {
          const created = await createPlane(payload);
          setPlanes((current) => [...current, created]);
        }
      } catch {
        setNotice("No se pudo guardar la aeronave");
        return;
      }
    }
    if (panel === "aerolineas") {
      try {
        const payload = { nombre: airlineForm.nombre!, codigoIata: airlineForm.codigoIata!, codigoIcao: airlineForm.codigoIcao!, pais: airlineForm.pais!, activo: airlineForm.activo };
        if (airlineForm.id && airlineForm.id > 0) {
          const updated = await updateAirline(airlineForm.id, payload);
          setAirlines((current) => current.map((airline) => airline.id === updated.id ? updated : airline));
        } else {
          const created = await createAirline(payload);
          setAirlines((current) => [...current, created]);
        }
      } catch {
        setNotice("No se pudo guardar la aerolínea");
        return;
      }
    }
    if (panel === "mantenimiento") upsert(maintenance, setMaintenance, maintenanceForm);
    if (panel === "tipos") upsert(seatTypes, setSeatTypes, { descripcion: "", ...seatTypeForm });
    setNotice("Cambios guardados");
    setPanel(null);
  };

  const seatCounts = seatTypeTotals(planes.filter((plane) => plane.activo));
  const activePlanes = planes.filter((plane) => plane.activo);

  return <div>
    <PageHeader title="Flota" subtitle="Aeronaves, aerolíneas operadoras, mantenimiento y catálogo de asientos."><Button onClick={openNew}><Plus className="size-4" /> Nueva {tabLabels[tab]}</Button></PageHeader>
    {notice && <div role="status" className="mb-4 rounded-md border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm">{notice}</div>}
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Aeronaves activas", activePlanes.length], ["Operativas", activePlanes.filter((plane) => planeStatus(plane) === "Operativa").length], ["En mantenimiento", planes.filter((plane) => planeStatus(plane) === "Mantenimiento").length], ["Capacidad total", activePlanes.reduce((total, plane) => total + plane.capacidad, 0)]].map(([label, value]) => <Card key={label} className="rounded-xl"><CardContent className="px-4 py-3"><div className="text-xs text-muted-foreground">{label}</div><div className="font-mono text-2xl font-medium">{value}</div></CardContent></Card>)}</div>
    <div className="overflow-hidden rounded-xl border border-border bg-card"><Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}><TabsList className="h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0">{[["aeronaves", "Aeronaves", planes.length], ["aerolineas", "Aerolíneas", airlines.length], ["mantenimiento", "Mantenimiento", maintenance.length], ["tipos", "Tipos de asiento", seatTypes.length]].map(([value, label, count]) => <TabsTrigger key={value} value={value as string} className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-accent data-[state=active]:bg-transparent">{label}<span className="ml-1 text-xs text-muted-foreground">{count}</span></TabsTrigger>)}</TabsList></Tabs>
      {tab === "aeronaves" && <div className="overflow-x-auto"><Table className="min-w-[850px]"><TableHeader><TableRow>{["Matrícula", "Aeronave", "Aerolínea", "Capacidad", "Estado operativo", "Activo", ""].map((head) => <TableHead key={head}>{head}</TableHead>)}</TableRow></TableHeader><TableBody>{isLoadingPlanes ? <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">Cargando aeronaves…</TableCell></TableRow> : planes.map((plane) => <TableRow key={plane.id}><TableCell className={`${tableCell} font-mono font-semibold`}>{plane.matricula}</TableCell><TableCell className={tableCell}>{plane.nombre ?? "—"}</TableCell><TableCell className={`${tableCell} text-muted-foreground`}>{airlineName(plane.aerolineaId)}</TableCell><TableCell className={`${tableCell} font-mono`}>{plane.capacidad}</TableCell><TableCell className={tableCell}><StatusBadge value={plane.activo ? planeStatus(plane) : "Inactivo"} /></TableCell><TableCell className={tableCell}><Switch checked={plane.activo} onCheckedChange={async (active) => { try { const updated = await updatePlane(plane.id, { aerolineaId: plane.aerolineaId, matricula: plane.matricula, nombre: plane.nombre, capacidad: plane.capacidad, activo: active }); setPlanes((current) => current.map((item) => item.id === updated.id ? updated : item)); } catch { setNotice("No se pudo actualizar el estado de la aeronave"); } }} aria-label={`Activo ${plane.matricula}`} /></TableCell><TableCell className={`${tableCell} whitespace-nowrap text-right`}><Button variant="outline" size="icon" className="mr-1" aria-label="Ver mapa de asientos"><Armchair className="size-3.5" /></Button><Button variant="outline" size="icon" aria-label={`Editar ${plane.matricula}`} onClick={() => { setPlaneForm({ ...plane }); setPanel("aeronaves"); }}><Pencil className="size-3.5" /></Button></TableCell></TableRow>)}</TableBody></Table></div>}
      {tab === "aerolineas" && <div className="overflow-x-auto"><Table className="min-w-[760px]"><TableHeader><TableRow>{["Aerolínea", "IATA", "ICAO", "País", "Aeronaves", "Activa", ""].map((head) => <TableHead key={head}>{head}</TableHead>)}</TableRow></TableHeader><TableBody>{isLoadingAirlines ? <TableRow><TableCell colSpan={7} className="p-8 text-center text-muted-foreground">Cargando aerolíneas…</TableCell></TableRow> : airlines.map((airline) => <TableRow key={airline.id}><TableCell className={`${tableCell} font-medium`}>{airline.nombre}</TableCell><TableCell className={`${tableCell} font-mono`}>{airline.codigoIata}</TableCell><TableCell className={`${tableCell} font-mono`}>{airline.codigoIcao}</TableCell><TableCell className={`${tableCell} text-muted-foreground`}>{airline.pais}</TableCell><TableCell className={`${tableCell} font-mono`}>{planes.filter((plane) => plane.aerolineaId === airline.id).length}</TableCell><TableCell className={tableCell}><Switch checked={airline.activo} onCheckedChange={async (active) => { try { const updated = await updateAirline(airline.id, { ...airline, activo: active }); setAirlines((current) => current.map((item) => item.id === updated.id ? updated : item)); } catch { setNotice("No se pudo actualizar el estado de la aerolínea"); } }} aria-label={`Activa ${airline.nombre}`} /></TableCell><TableCell className={`${tableCell} text-right`}><Button variant="outline" size="icon" aria-label={`Editar ${airline.nombre}`} onClick={() => { setAirlineForm(airline); setPanel("aerolineas"); }}><Pencil className="size-3.5" /></Button></TableCell></TableRow>)}</TableBody></Table></div>}
      {tab === "mantenimiento" && <><div className="border-b border-border bg-accent/5 px-4 py-2.5 text-xs text-muted-foreground">Tabla propuesta <span className="font-mono text-foreground">Mantenimiento</span>. Mientras haya una orden EN_CURSO, la aeronave no puede asignarse a vuelos nuevos.</div><div className="overflow-x-auto"><Table className="min-w-[980px]"><TableHeader><TableRow>{["Aeronave", "Tipo", "Trabajo", "Inicio", "Fin estimado", "Estado", "Responsable", ""].map((head) => <TableHead key={head}>{head}</TableHead>)}</TableRow></TableHeader><TableBody>{maintenance.map((item) => <TableRow key={item.id}><TableCell className={`${tableCell} font-mono font-semibold`}>{planes.find((plane) => plane.id === item.avion)?.matricula ?? "—"}</TableCell><TableCell className={tableCell}><StatusBadge value={item.tipo} /></TableCell><TableCell className={tableCell}>{item.descripcion}</TableCell><TableCell className={`${tableCell} font-mono`}>{item.inicio}</TableCell><TableCell className={`${tableCell} font-mono`}>{item.fin}</TableCell><TableCell className={tableCell}><StatusBadge value={item.estado} /></TableCell><TableCell className={`${tableCell} text-muted-foreground`}>{usuarios.find((user) => user.id === item.responsable)?.nombre}</TableCell><TableCell className={`${tableCell} whitespace-nowrap text-right`}>{item.estado === "EN_CURSO" && <Button className="mr-1 h-8" onClick={() => { setMaintenance((current) => current.map((entry) => entry.id === item.id ? { ...entry, estado: "COMPLETADO" } : entry)); setNotice("Mantenimiento completado · aeronave operativa"); }}>Completar</Button>}<Button variant="outline" size="icon" aria-label="Editar mantenimiento" onClick={() => { setMaintenanceForm(item); setPanel("mantenimiento"); }}><Pencil className="size-3.5" /></Button></TableCell></TableRow>)}</TableBody></Table></div></>}
      {tab === "tipos" && <div className="overflow-x-auto"><Table className="min-w-[620px]"><TableHeader><TableRow>{["Tipo de asiento", "Descripción", "Asientos en flota", ""].map((head) => <TableHead key={head}>{head}</TableHead>)}</TableRow></TableHeader><TableBody>{seatTypes.map((type, index) => <TableRow key={type.id}><TableCell className={`${tableCell} font-medium`}>{type.nombre}</TableCell><TableCell className={`${tableCell} text-muted-foreground`}>{type.descripcion}</TableCell><TableCell className={`${tableCell} font-mono`}>{(seatCounts[index] ?? 0).toLocaleString("en-US")}</TableCell><TableCell className={`${tableCell} text-right`}><Button variant="outline" size="icon" aria-label={`Editar ${type.nombre}`} onClick={() => { setSeatTypeForm(type); setPanel("tipos"); }}><Pencil className="size-3.5" /></Button></TableCell></TableRow>)}</TableBody></Table></div>}
    </div>
    <Sheet open={!!panel} onOpenChange={(open) => !open && setPanel(null)}><SheetContent className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>{panel && `${panel === "aeronaves" ? isNew(planeForm) ? "Nueva" : "Editar" : panel === "aerolineas" ? isNew(airlineForm) ? "Nueva" : "Editar" : panel === "mantenimiento" ? isNew(maintenanceForm) ? "Nuevo" : "Editar" : isNew(seatTypeForm) ? "Nuevo" : "Editar"} ${tabLabels[panel]}`}</SheetTitle><SheetDescription>Gestiona los datos del catálogo seleccionado.</SheetDescription></SheetHeader><div className="grid gap-4 py-6">
      {panel === "aeronaves" && <><Field label="Aerolínea"><SelectField options={airlineOptions} value={planeForm.aerolineaId ?? null} onChange={(value) => setPlaneForm({ ...planeForm, aerolineaId: value ?? undefined })} placeholder="Seleccionar aerolínea…" /></Field><Field label="Matrícula"><Input value={planeForm.matricula ?? ""} onChange={(event) => setPlaneForm({ ...planeForm, matricula: event.target.value.toUpperCase() })} placeholder="N-AX600" className="font-mono" /></Field><Field label="Nombre / modelo"><Input value={planeForm.nombre ?? ""} onChange={(event) => setPlaneForm({ ...planeForm, nombre: event.target.value })} placeholder="Airbus A320neo" /></Field><Field label="Capacidad (asientos)"><Input type="number" min={1} value={planeForm.capacidad ?? ""} onChange={(event) => setPlaneForm({ ...planeForm, capacidad: Number(event.target.value) })} className="font-mono" /></Field><div className="flex items-center justify-between"><div><div className="text-sm font-medium">Aeronave activa</div><div className="text-xs text-muted-foreground">Las inactivas no aparecen al programar vuelos.</div></div><Switch checked={!!planeForm.activo} onCheckedChange={(active) => setPlaneForm({ ...planeForm, activo: active })} aria-label="Aeronave activa" /></div></>}
      {panel === "aerolineas" && <><Field label="Nombre"><Input value={airlineForm.nombre ?? ""} onChange={(event) => setAirlineForm({ ...airlineForm, nombre: event.target.value })} /></Field><div className="grid grid-cols-2 gap-4"><Field label="IATA" hint="2 letras"><Input maxLength={2} value={airlineForm.codigoIata ?? ""} onChange={(event) => setAirlineForm({ ...airlineForm, codigoIata: event.target.value.toUpperCase() })} className="font-mono" /></Field><Field label="ICAO" hint="3 letras"><Input maxLength={3} value={airlineForm.codigoIcao ?? ""} onChange={(event) => setAirlineForm({ ...airlineForm, codigoIcao: event.target.value.toUpperCase() })} className="font-mono" /></Field></div><Field label="País"><Input value={airlineForm.pais ?? ""} onChange={(event) => setAirlineForm({ ...airlineForm, pais: event.target.value })} /></Field><div className="flex items-center justify-between"><span className="text-sm font-medium">Aerolínea activa</span><Switch checked={!!airlineForm.activo} onCheckedChange={(active) => setAirlineForm({ ...airlineForm, activo: active })} aria-label="Aerolínea activa" /></div></>}
      {panel === "mantenimiento" && <><Field label="Aeronave"><SelectField options={planeOptions} value={maintenanceForm.avion ?? null} onChange={(value) => setMaintenanceForm({ ...maintenanceForm, avion: value ?? undefined })} placeholder="Seleccionar matrícula…" /></Field><div className="grid grid-cols-2 gap-4"><Field label="Tipo"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={maintenanceForm.tipo ?? "PREVENTIVO"} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, tipo: event.target.value as MantTipo })}>{["PREVENTIVO", "CORRECTIVO", "INSPECCION"].map((type) => <option key={type}>{type}</option>)}</select></Field><Field label="Estado"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={maintenanceForm.estado ?? "PROGRAMADO"} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, estado: event.target.value as MantEstado })}>{["PROGRAMADO", "EN_CURSO", "COMPLETADO"].map((state) => <option key={state}>{state}</option>)}</select></Field></div><Field label="Descripción del trabajo"><Input value={maintenanceForm.descripcion ?? ""} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, descripcion: event.target.value })} /></Field><div className="grid grid-cols-2 gap-4"><Field label="Inicio"><Input type="date" value={maintenanceForm.inicio ?? ""} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, inicio: event.target.value })} className="font-mono" /></Field><Field label="Fin estimado"><Input type="date" value={maintenanceForm.fin ?? ""} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, fin: event.target.value })} className="font-mono" /></Field></div><Field label="Responsable"><SelectField options={usuarios.filter((user) => user.activo).map((user) => ({ value: user.id, label: user.nombre, sub: user.correo }))} value={maintenanceForm.responsable ?? null} onChange={(value) => setMaintenanceForm({ ...maintenanceForm, responsable: value ?? undefined })} placeholder="Seleccionar responsable…" /></Field></>}
      {panel === "tipos" && <><Field label="Nombre"><Input value={seatTypeForm.nombre ?? ""} onChange={(event) => setSeatTypeForm({ ...seatTypeForm, nombre: event.target.value })} /></Field><Field label="Descripción"><Input value={seatTypeForm.descripcion ?? ""} onChange={(event) => setSeatTypeForm({ ...seatTypeForm, descripcion: event.target.value })} /></Field></>}
    </div><SheetFooter><Button variant="outline" onClick={() => setPanel(null)}>Cancelar</Button><Button onClick={save} disabled={!valid}>Guardar</Button></SheetFooter></SheetContent></Sheet>
  </div>;
}
