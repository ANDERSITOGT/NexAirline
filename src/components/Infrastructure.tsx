import { useEffect, useState, type ReactNode } from "react";
import { Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gates as seedGateNumbers, routes as seedRoutes, fmtDuration, type Route } from "../data1";
import { gateRows as seedGates, terminals as seedTerminals, type GateRow, type Terminal } from "../data2";
import { createAirport, getAirports, updateAirport, type Airport } from "../services/airportService";

type Tab = "aeropuertos" | "terminales" | "rutas" | "puertas";
const tabs: { id: Tab; label: string; singular: string }[] = [
  { id: "aeropuertos", label: "Aeropuertos", singular: "aeropuerto" },
  { id: "terminales", label: "Terminales", singular: "terminal" },
  { id: "rutas", label: "Rutas", singular: "ruta" },
  { id: "puertas", label: "Puertas de embarque", singular: "puerta" },
];
const cellClass = "px-4 py-3";
const fieldClass = "grid gap-1.5 text-sm font-medium";
type AirportForm = { id: number; nombre: string; iata: string; icao: string; ciudad: string; pais: string; direccion: string; activo: boolean };
const blankAirport: AirportForm = { id: 0, nombre: "", iata: "", icao: "", ciudad: "", pais: "", direccion: "", activo: true };

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className={fieldClass}><span>{label}</span>{children}{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</label>;
}

function Status({ active, onChange, label }: { active: boolean; onChange: (value: boolean) => void; label: string }) {
  return <div className="flex items-center gap-3"><Switch checked={active} onCheckedChange={onChange} aria-label={label} /><Badge variant={active ? "default" : "secondary"}>{active ? "Activo" : "Inactivo"}</Badge></div>;
}

function CatalogTable({ children, headings }: { children: ReactNode; headings: string[] }) {
  return <Table className="min-w-[700px]"><TableHeader><TableRow>{headings.map((heading) => <TableHead key={heading} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">{heading}</TableHead>)}</TableRow></TableHeader><TableBody>{children}</TableBody></Table>;
}

export default function Infrastructure() {
  const [tab, setTab] = useState<Tab>("aeropuertos");
  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoadingAirports, setIsLoadingAirports] = useState(true);
  const [terminals, setTerminals] = useState(seedTerminals);
  const [routes, setRoutes] = useState(seedRoutes);
  const [gates, setGates] = useState(seedGates);
  const [panel, setPanel] = useState<Tab | null>(null);
  const [airport, setAirport] = useState<AirportForm>(blankAirport);
  const [terminal, setTerminal] = useState<Partial<Terminal>>({ activo: true });
  const [route, setRoute] = useState<Partial<Route>>({ activa: true });
  const [gate, setGate] = useState<Partial<GateRow>>({ activo: true });
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const loadAirports = async () => {
      try {
        setAirports(await getAirports());
      } catch {
        setNotice("No se pudieron cargar los aeropuertos");
      } finally {
        setIsLoadingAirports(false);
      }
    };
    void loadAirports();
  }, []);
  const current = tabs.find((item) => item.id === tab)!;
  const airportById = (id: number) => airports.find((item) => item.id === id);
  const terminalById = (id: number) => terminals.find((item) => item.id === id);
  const routeInvalid = !route.origen || !route.destino || route.origen === route.destino || !route.duracion;
  const canSave = panel === "aeropuertos" ? !!airport.nombre && airport.iata.length === 3 && airport.icao.length === 4
    : panel === "terminales" ? !!terminal.aeropuerto && !!terminal.nombre
    : panel === "rutas" ? !routeInvalid
    : !!gate.terminal && !!gate.numero;

  const openNew = () => {
    if (tab === "aeropuertos") setAirport({ ...blankAirport, id: 0 });
    if (tab === "terminales") setTerminal({ activo: true });
    if (tab === "rutas") setRoute({ activa: true });
    if (tab === "puertas") setGate({ activo: true });
    setPanel(tab);
  };
  const close = () => setPanel(null);
  const save = async () => {
    const id = Date.now();
    if (panel === "aeropuertos") {
      if (airport.id) {
        try {
          const updated = await updateAirport(airport.id, { nombre: airport.nombre, codigoIata: airport.iata, codigoIcao: airport.icao, ciudad: airport.ciudad, pais: airport.pais, direccion: airport.direccion, activo: airport.activo });
          setAirports((items) => items.map((item) => item.id === updated.id ? updated : item));
        } catch {
          setNotice("No se pudo actualizar el aeropuerto");
          return;
        }
      } else {
        try {
          const created = await createAirport({ nombre: airport.nombre, codigoIata: airport.iata, codigoIcao: airport.icao, ciudad: airport.ciudad, pais: airport.pais, direccion: airport.direccion });
          setAirports((items) => [...items, created]);
        } catch {
          setNotice("No se pudo crear el aeropuerto");
          return;
        }
      }
    }
    if (panel === "terminales") setTerminals((items) => [...items, { id, descripcion: "", ...terminal } as Terminal]);
    if (panel === "rutas") setRoutes((items) => [...items, { id, distancia: 0, ...route } as Route]);
    if (panel === "puertas") setGates((items) => [...items, { id, descripcion: "", ...gate } as GateRow]);
    setTab(panel!);
    close();
  };

  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Catálogos base</h1><p className="mt-1 text-sm text-muted-foreground">Infraestructura logística que alimenta rutas y vuelos.</p></div><Button onClick={openNew}><Plus className="size-4" /> Nuevo {current.singular}</Button></div>
    {notice && <div role="status" className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">{notice}</div>}
    <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
      <Card className="overflow-hidden rounded-xl"><TabsList className="flex h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-card p-0"><TabsTrigger value="aeropuertos" className="rounded-none px-4 py-3.5">Aeropuertos <Badge variant="secondary" className="ml-1">{airports.length}</Badge></TabsTrigger><TabsTrigger value="terminales" className="rounded-none px-4 py-3.5">Terminales <Badge variant="secondary" className="ml-1">{terminals.length}</Badge></TabsTrigger><TabsTrigger value="rutas" className="rounded-none px-4 py-3.5">Rutas <Badge variant="secondary" className="ml-1">{routes.length}</Badge></TabsTrigger><TabsTrigger value="puertas" className="rounded-none px-4 py-3.5">Puertas de embarque <Badge variant="secondary" className="ml-1">{gates.length}</Badge></TabsTrigger></TabsList>
        <CardContent className="overflow-x-auto p-0">
          <TabsContent value="aeropuertos" className="mt-0"><CatalogTable headings={["IATA", "Nombre", "Ubicación", "ICAO", "Activo", ""]}>{isLoadingAirports ? <TableRow><TableCell colSpan={6} className="p-8 text-center text-muted-foreground">Cargando aeropuertos…</TableCell></TableRow> : airports.map((item) => <TableRow key={item.id}><TableCell className={cellClass}><Badge>{item.codigoIata}</Badge></TableCell><TableCell className={`${cellClass} font-medium`}>{item.nombre}</TableCell><TableCell className={`${cellClass} text-muted-foreground`}>{item.ciudad}, {item.pais}</TableCell><TableCell className={`${cellClass} font-mono`}>{item.codigoIcao}</TableCell><TableCell className={cellClass}><Status active={!!item.activo} onChange={async (active) => { try { const updated = await updateAirport(item.id, { activo: active }); setAirports((items) => items.map((currentItem) => currentItem.id === updated.id ? updated : currentItem)); } catch { setNotice("No se pudo actualizar el estado del aeropuerto"); } }} label={`Activo ${item.codigoIata}`} /></TableCell><TableCell className={`${cellClass} text-right`}><Button variant="outline" size="icon" aria-label={`Editar ${item.codigoIata}`} onClick={() => { setAirport({ id: item.id, nombre: item.nombre, iata: item.codigoIata, icao: item.codigoIcao, ciudad: item.ciudad, pais: item.pais, direccion: item.direccion ?? "", activo: item.activo ?? true }); setPanel("aeropuertos"); }}><Pencil className="size-3.5" /></Button></TableCell></TableRow>)}</CatalogTable></TabsContent>
          <TabsContent value="terminales" className="mt-0"><CatalogTable headings={["Aeropuerto", "Terminal", "Descripción", "Activo"]}>{terminals.map((item) => <TableRow key={item.id}><TableCell className={`${cellClass} font-mono font-medium`}>{airportById(item.aeropuerto)?.codigoIata ?? "—"}</TableCell><TableCell className={`${cellClass} font-medium`}>{item.nombre}</TableCell><TableCell className={`${cellClass} text-muted-foreground`}>{item.descripcion || "—"}</TableCell><TableCell className={cellClass}><Status active={item.activo} onChange={(active) => setTerminals((items) => items.map((currentItem) => currentItem.id === item.id ? { ...currentItem, activo: active } : currentItem))} label={`Activo ${item.nombre}`} /></TableCell></TableRow>)}</CatalogTable></TabsContent>
          <TabsContent value="rutas" className="mt-0"><CatalogTable headings={["Origen", "Destino", "Duración est.", "Distancia", "Activa"]}>{routes.map((item) => <TableRow key={item.id}><TableCell className={cellClass}><span className="font-mono font-semibold">{airportById(item.origen)?.codigoIata}</span> <span className="text-muted-foreground">{airportById(item.origen)?.ciudad}</span></TableCell><TableCell className={cellClass}><span className="font-mono font-semibold">{airportById(item.destino)?.codigoIata}</span> <span className="text-muted-foreground">{airportById(item.destino)?.ciudad}</span></TableCell><TableCell className={`${cellClass} font-mono`}>{fmtDuration(item.duracion)}</TableCell><TableCell className={`${cellClass} font-mono`}>{item.distancia ? `${item.distancia.toLocaleString("es-GT")} km` : "—"}</TableCell><TableCell className={cellClass}><Status active={item.activa} onChange={(active) => setRoutes((items) => items.map((currentItem) => currentItem.id === item.id ? { ...currentItem, activa: active } : currentItem))} label="Ruta activa" /></TableCell></TableRow>)}</CatalogTable></TabsContent>
          <TabsContent value="puertas" className="mt-0"><CatalogTable headings={["Terminal", "Puerta", "Descripción", "Activa"]}>{gates.map((item) => { const terminalItem = terminalById(item.terminal); return <TableRow key={item.id}><TableCell className={cellClass}><span className="font-mono font-semibold">{terminalItem ? airportById(terminalItem.aeropuerto)?.codigoIata : "—"}</span> · {terminalItem?.nombre}</TableCell><TableCell className={`${cellClass} font-mono font-medium`}>{item.numero}</TableCell><TableCell className={`${cellClass} text-muted-foreground`}>{item.descripcion || "—"}</TableCell><TableCell className={cellClass}><Status active={item.activo} onChange={(active) => setGates((items) => items.map((currentItem) => currentItem.id === item.id ? { ...currentItem, activo: active } : currentItem))} label={`Activa ${item.numero}`} /></TableCell></TableRow>; })}</CatalogTable></TabsContent>
        </CardContent>
      </Card>
    </Tabs>

    <Sheet open={!!panel} onOpenChange={(open) => !open && close()}><SheetContent className="overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>{panel === "aeropuertos" && airport.id ? `Editar ${airport.iata}` : `${panel ? "Nuevo" : ""} ${tabs.find((item) => item.id === panel)?.singular ?? ""}`}</SheetTitle><SheetDescription>{panel === "aeropuertos" ? "Tabla Aeropuerto" : panel === "terminales" ? "Tabla Terminal" : panel === "rutas" ? "Tabla Ruta" : "Tabla Puerta_embarque"}</SheetDescription></SheetHeader><div className="grid gap-4 py-6">
      {panel === "aeropuertos" && <><Field label="Nombre"><Input value={airport.nombre} onChange={(event) => setAirport({ ...airport, nombre: event.target.value })} /></Field><div className="grid grid-cols-2 gap-4"><Field label="Código IATA" hint="3 letras"><Input maxLength={3} value={airport.iata} onChange={(event) => setAirport({ ...airport, iata: event.target.value.toUpperCase() })} className="font-mono" /></Field><Field label="Código ICAO" hint="4 letras"><Input maxLength={4} value={airport.icao} onChange={(event) => setAirport({ ...airport, icao: event.target.value.toUpperCase() })} className="font-mono" /></Field></div><div className="grid grid-cols-2 gap-4"><Field label="Ciudad"><Input value={airport.ciudad} onChange={(event) => setAirport({ ...airport, ciudad: event.target.value })} /></Field><Field label="País"><Input value={airport.pais} onChange={(event) => setAirport({ ...airport, pais: event.target.value })} /></Field></div><Field label="Dirección"><Input value={airport.direccion} onChange={(event) => setAirport({ ...airport, direccion: event.target.value })} /></Field><div className="flex items-center justify-between rounded-lg bg-background p-4"><span className="text-sm font-medium">Aeropuerto activo</span><Switch checked={airport.activo} onCheckedChange={(active) => setAirport({ ...airport, activo: active })} aria-label="Aeropuerto activo" /></div></>}
      {panel === "terminales" && <><Field label="Aeropuerto"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={terminal.aeropuerto ?? ""} onChange={(event) => setTerminal({ ...terminal, aeropuerto: Number(event.target.value) || undefined })}><option value="">Selecciona un aeropuerto</option>{airports.map((item) => <option key={item.id} value={item.id}>{item.codigoIata} · {item.nombre}</option>)}</select></Field><Field label="Nombre"><Input value={terminal.nombre ?? ""} onChange={(event) => setTerminal({ ...terminal, nombre: event.target.value })} /></Field><Field label="Descripción"><Input value={terminal.descripcion ?? ""} onChange={(event) => setTerminal({ ...terminal, descripcion: event.target.value })} /></Field><div className="flex items-center justify-between rounded-lg bg-background p-4"><span className="text-sm font-medium">Terminal activa</span><Switch checked={!!terminal.activo} onCheckedChange={(active) => setTerminal({ ...terminal, activo: active })} aria-label="Terminal activa" /></div></>}
      {panel === "rutas" && <><Field label="Aeropuerto de origen"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={route.origen ?? ""} onChange={(event) => setRoute({ ...route, origen: Number(event.target.value) || undefined })}><option value="">Selecciona origen</option>{airports.map((item) => <option key={item.id} value={item.id}>{item.codigoIata} · {item.ciudad}</option>)}</select></Field><Field label="Aeropuerto de destino"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={route.destino ?? ""} onChange={(event) => setRoute({ ...route, destino: Number(event.target.value) || undefined })}><option value="">Selecciona destino</option>{airports.filter((item) => item.id !== route.origen).map((item) => <option key={item.id} value={item.id}>{item.codigoIata} · {item.ciudad}</option>)}</select></Field><div className="grid grid-cols-2 gap-4"><Field label="Duración (min)"><Input type="number" min={1} value={route.duracion ?? ""} onChange={(event) => setRoute({ ...route, duracion: Number(event.target.value) || undefined })} className="font-mono" /></Field><Field label="Distancia (km)"><Input type="number" min={0} value={route.distancia ?? ""} onChange={(event) => setRoute({ ...route, distancia: Number(event.target.value) || 0 })} className="font-mono" /></Field></div><div className="flex items-center justify-between rounded-lg bg-background p-4"><span className="text-sm font-medium">Ruta activa</span><Switch checked={!!route.activa} onCheckedChange={(active) => setRoute({ ...route, activa: active })} aria-label="Ruta activa" /></div></>}
      {panel === "puertas" && <><Field label="Terminal"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={gate.terminal ?? ""} onChange={(event) => setGate({ ...gate, terminal: Number(event.target.value) || undefined })}><option value="">Selecciona terminal</option>{terminals.map((item) => <option key={item.id} value={item.id}>{item.nombre} · {airportById(item.aeropuerto)?.codigoIata}</option>)}</select></Field><Field label="Número de puerta"><Input list="gate-numbers" value={gate.numero ?? ""} onChange={(event) => setGate({ ...gate, numero: event.target.value.toUpperCase() })} className="font-mono" /><datalist id="gate-numbers">{seedGateNumbers.map((number) => <option key={number} value={number} />)}</datalist></Field><Field label="Descripción"><Input value={gate.descripcion ?? ""} onChange={(event) => setGate({ ...gate, descripcion: event.target.value })} /></Field><div className="flex items-center justify-between rounded-lg bg-background p-4"><span className="text-sm font-medium">Puerta activa</span><Switch checked={!!gate.activo} onCheckedChange={(active) => setGate({ ...gate, activo: active })} aria-label="Puerta activa" /></div></>}
    </div><SheetFooter><Button variant="outline" onClick={close}>Cancelar</Button><Button disabled={!canSave} onClick={save}>Guardar</Button></SheetFooter></SheetContent></Sheet>
  </div>;
}