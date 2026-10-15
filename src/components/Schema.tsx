import { useState } from "react";
import { AlertTriangle, ArrowUpRight, Check, Copy, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ModuleTable = [string, string, string | null];
const modules: { name: string; tables: ModuleTable[] }[] = [
  { name: "Operaciones", tables: [["Vuelo", "Vuelos y estados", "/vuelos"], ["Itinerario / Itinerario_vuelo", "Segmentos de reserva", "/reservas"], ["Reasignacion", "Traslado de pasajeros", "/reasignaciones"]] },
  { name: "Flota", tables: [["Avion", "Aeronaves", "/flota"], ["Aerolinea", "Operadores", "/flota"], ["Asiento / Tipo_asiento", "Configuración de cabina", "/flota"], ["Vuelo_asiento", "Inventario por vuelo", "/asientos"], ["Bitacora_asiento", "Auditoría de asientos", "/bitacora"], ["Mantenimiento (nueva)", "Órdenes de taller", "/flota"]] },
  { name: "Infraestructura", tables: [["Aeropuerto", "Catálogo", "/infraestructura"], ["Terminal", "Por aeropuerto", "/infraestructura"], ["Puerta_embarque", "Por terminal", "/infraestructura"], ["Ruta", "Origen-destino", "/infraestructura"]] },
  { name: "Ventas", tables: [["Reserva / Reserva_detalle", "Panel de reservas", "/reservas"], ["Boleto", "Detalle expandible", "/reservas"], ["Pago", "Conciliación", "/pagos"], ["Metodo_pago", "Catálogo", "/pagos"]] },
  { name: "Seguridad", tables: [["Usuario", "Cuentas internas", "/seguridad"], ["Rol", "Perfiles", "/seguridad"], ["Permiso / Rol_permiso (nuevas)", "Matriz de acceso", "/seguridad"], ["Error", "Consola técnica", "/seguridad"]] },
];

const findings = [
  ["Mantenimiento inexistente", "Avion solo tiene un estado; no hay historial ni fechas de taller. Se propone la tabla Mantenimiento para bloquear aeronaves en la programación de vuelos."],
  ["Permisos no modelados", "Rol es un nombre plano. Sin Permiso/Rol_permiso no se puede restringir qué módulo ve cada perfil."],
  ["Sin restricción de solapamiento", "Vuelo no impide que una aeronave o una puerta se asignen a dos vuelos a la vez. La UI lo detecta, pero conviene reforzarlo con una restricción de exclusión."],
  ["Auditoría incompleta", "Solo Bitacora_asiento registra cambios. Vuelo, Pago y Usuario no guardan quién ni cuándo editó (faltan creado_por, actualizado_en)."],
  ["Totales derivados", "Reserva no guarda subtotal ni impuestos; se calculan a partir de Reserva_detalle (12 %). Una vista SQL evitaría divergencias entre pantallas."],
  ["Borrado lógico parcial", "Pago tiene eliminado_por, pero Reserva, Vuelo y Usuario solo usan activo o estados. Conviene unificar el criterio."],
];

const sql = `CREATE TABLE Mantenimiento (
  id_mantenimiento SERIAL PRIMARY KEY,
  id_avion         INT NOT NULL REFERENCES Avion(id_avion),
  tipo             VARCHAR(12) NOT NULL CHECK (tipo IN ('PREVENTIVO','CORRECTIVO','INSPECCION')),
  descripcion      TEXT NOT NULL,
  fecha_inicio     DATE NOT NULL,
  fecha_fin        DATE NOT NULL CHECK (fecha_fin >= fecha_inicio),
  estado           VARCHAR(12) NOT NULL DEFAULT 'PROGRAMADO'
                   CHECK (estado IN ('PROGRAMADO','EN_CURSO','COMPLETADO')),
  id_responsable   INT REFERENCES Usuario(id_usuario)
);

CREATE TABLE Permiso (
  id_permiso SERIAL PRIMARY KEY,
  modulo     VARCHAR(30) NOT NULL,
  accion     VARCHAR(10) NOT NULL CHECK (accion IN ('VER','CREAR','EDITAR','ELIMINAR')),
  UNIQUE (modulo, accion)
);

CREATE TABLE Rol_permiso (
  id_rol     INT REFERENCES Rol(id_rol),
  id_permiso INT REFERENCES Permiso(id_permiso),
  PRIMARY KEY (id_rol, id_permiso)
);`;

export default function Schema() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const copySql = async () => {
    await navigator.clipboard?.writeText(sql);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <div><div className="mb-6"><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Modelo de datos</h1><p className="mt-1 text-sm text-muted-foreground">Cobertura del esquema administrativo por pantalla. Las tablas de Cliente quedan fuera del alcance.</p></div><div className="mb-4 grid gap-3 sm:grid-cols-3">{[["Tablas administrativas cubiertas", "21"], ["Tablas nuevas propuestas", "3"], ["Hallazgos en el esquema", String(findings.length)]].map(([label, value]) => <Card key={label}><CardContent className="px-4 py-3"><div className="text-xs text-muted-foreground">{label}</div><div className="font-mono text-2xl font-medium">{value}</div></CardContent></Card>)}</div><Tabs defaultValue="mapa"><TabsList className="mb-4"><TabsTrigger value="mapa">Mapa por módulo</TabsTrigger><TabsTrigger value="hallazgos">Hallazgos <Badge variant="secondary" className="ml-1">{findings.length}</Badge></TabsTrigger><TabsTrigger value="sql">SQL propuesto</TabsTrigger></TabsList><TabsContent value="mapa" className="mt-0"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{modules.map((module) => <Card key={module.name} className="overflow-hidden rounded-xl"><CardHeader className="border-b border-border px-4 py-3"><CardTitle className="text-sm">{module.name}</CardTitle></CardHeader><CardContent className="p-0"><ul className="divide-y divide-border">{module.tables.map(([table, description, path]) => <li key={table}><Button variant="ghost" disabled={!path} onClick={() => path && navigate(path)} className="flex h-auto w-full items-center justify-between gap-3 rounded-none px-4 py-2.5 text-left"><span className="min-w-0"><span className="block truncate font-mono text-[13px]">{table}</span><span className="text-xs text-muted-foreground">{description}</span></span>{table.includes("nueva") ? <Badge variant="secondary">NUEVA</Badge> : <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />}</Button></li>)}</ul></CardContent></Card>)}</div></TabsContent><TabsContent value="hallazgos" className="mt-0"><ul className="grid gap-3 md:grid-cols-2">{findings.map(([title, description]) => <li key={title}><Card className="h-full"><CardContent className="flex gap-3 p-4"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" /><div><div className="text-sm font-semibold">{title}</div><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></CardContent></Card></li>)}</ul></TabsContent><TabsContent value="sql" className="mt-0"><Card className="overflow-hidden rounded-xl"><div className="flex items-center justify-between bg-primary px-4 py-2.5 text-white"><span className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-accent" /> Tablas nuevas</span><Button variant="secondary" className="h-8" onClick={copySql}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copiado" : "Copiar"}</Button></div><CardContent className="p-0"><pre className="overflow-x-auto bg-[#0e1b2e] p-4 font-mono text-xs leading-relaxed text-[#cfe0f5]">{sql}</pre></CardContent></Card></TabsContent></Tabs></div>;
}