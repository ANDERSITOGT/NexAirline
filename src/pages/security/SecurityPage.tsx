import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Plus, RefreshCw, Terminal } from "lucide-react";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createSecurityUser,
  getServerLogs,
  getSecurityRoles,
  getSecurityUsers,
  toggleSecurityUser,
  type SecurityRole,
  type SecurityUser,
} from "@/services/securityService";
import { usePreferences } from "@/contexts/usePreferences";
import { formatDateTime } from "@/utils/dateUtils";

type SecurityTab = "usuarios" | "errores";
type UserDraft = {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  rol: string;
};

const blankUser: UserDraft = {
  nombre: "",
  apellido: "",
  correo: "",
  password: "",
  rol: "",
};

const roleName = (role: SecurityUser["rol"], roles: SecurityRole[]) => {
  if (typeof role === "object" && role) return role.nombre;
  const match = roles.find((item) => String(item.id) === String(role));
  return match?.nombre ?? String(role);
};

const userDisplayName = (user: SecurityUser) =>
  [user.nombre, user.apellido].filter(Boolean).join(" ");

export default function Security() {
  const { timezone } = usePreferences();
  const [tab, setTab] = useState<SecurityTab>("usuarios");
  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const [userDraft, setUserDraft] = useState<UserDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      setLogs(await getServerLogs());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los logs del servidor.");
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const loadSecurityData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [loadedUsers, loadedRoles] = await Promise.all([
        getSecurityUsers(),
        getSecurityRoles(),
      ]);
      setUsers(loadedUsers);
      setRoles(loadedRoles.filter((role) => ["Administrador", "Manager"].includes(role.nombre)));
      await refreshLogs();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar la información de seguridad.");
    } finally {
      setLoading(false);
    }
  }, [refreshLogs]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadSecurityData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadSecurityData]);

  const activeUsers = users.filter((user) => user.activo).length;
  const canSaveUser = Boolean(
    userDraft?.nombre.trim() &&
    userDraft.apellido.trim() &&
    userDraft.correo.includes("@") &&
    userDraft.password &&
    userDraft.rol,
  );

  const handleToggleUser = async (user: SecurityUser) => {
    setTogglingId(user.id);
    setError("");
    try {
      const updated = await toggleSecurityUser(user.id);
      setUsers((current) => current.map((item) => (
        item.id === user.id
          ? { ...item, activo: updated && "activo" in updated ? updated.activo : !item.activo }
          : item
      )));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cambiar el estado del usuario.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userDraft || !canSaveUser) return;
    setSaving(true);
    setError(null);
    try {
      await createSecurityUser({
        nombre: userDraft.nombre.trim(),
        apellido: userDraft.apellido.trim(),
        correo: userDraft.correo.trim(),
        password: userDraft.password,
        rol_id: Number(userDraft.rol),
      });
      setUserDraft(null);
      const refreshedUsers = await getSecurityUsers();
      setUsers(refreshedUsers);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (tab !== "errores" || !autoRefresh) return;
    const intervalId = window.setInterval(() => void refreshLogs(), 3000);
    return () => window.clearInterval(intervalId);
  }, [autoRefresh, refreshLogs, tab]);

  useEffect(() => {
    const container = logsContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [logs]);

  const highlightLogLine = (line: string, lineIndex: number) => {
    const parts = line.split(/(\[GIN\]|SLOW SQL|WARN|ERROR|\b[45]\d{2}\b)/g);
    return (
      <div key={`${lineIndex}-${line}`} className="min-h-5 whitespace-pre-wrap">
        {parts.map((part, index) => {
          const className = part === "[GIN]"
            ? "text-cyan-400"
            : part === "SLOW SQL" || part === "WARN"
              ? "text-yellow-400"
              : part === "ERROR" || /^[45]\d{2}$/.test(part)
                ? "text-red-400"
                : "text-slate-200";
          return <span key={`${index}-${part}`} className={className}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div>
      <AppBreadcrumb items={[{ label: "Seguridad", href: "/seguridad" }, { label: "Roles y errores" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Seguridad y sistema</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Asignación de roles a usuarios administrativos y registro de errores.
        </p>
      </div>
      {error && <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      <Tabs value={tab} onValueChange={(value) => setTab(value as SecurityTab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="usuarios">Usuarios y roles</TabsTrigger>
          <TabsTrigger value="errores">
            Consola de errores <Badge variant="secondary" className="ml-1">{logs.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios" className="mt-0">
          <Card className="overflow-hidden rounded-xl">
            <CardHeader className="flex-row items-center justify-between border-b border-border">
              <div>
                <CardTitle className="text-base">Usuarios y roles</CardTitle>
                <p className="text-sm text-muted-foreground">{activeUsers} de {users.length} usuarios activos</p>
              </div>
              <Button onClick={() => setUserDraft({ ...blankUser })}><Plus className="size-4" /> Nuevo usuario</Button>
            </CardHeader>
            <div className="grid gap-px border-b border-border bg-border sm:grid-cols-2">
              {roles.map((role) => (
                <div key={role.id} className="bg-background px-4 py-3" title={role.descripcion ?? undefined}>
                  <div className="font-mono text-xl font-medium">{users.filter((user) => roleName(user.rol, roles) === role.nombre).length}</div>
                  <div className="text-xs text-muted-foreground">{role.nombre}</div>
                </div>
              ))}
            </div>
            <CardContent className="p-0">
              {loading ? (
                <p className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Cargando usuarios...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[760px]">
                    <TableHeader><TableRow className="bg-background">
                      <TableHead className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">Usuario</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Rol</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Creado</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Estado</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className={user.activo ? "" : "opacity-60"}>
                          <TableCell className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                {userDisplayName(user).split(" ").map((name) => name[0]).join("")}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{userDisplayName(user)}</div>
                                <div className="truncate text-xs text-muted-foreground">{user.correo}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3"><Badge variant="outline">{roleName(user.rol, roles)}</Badge></TableCell>
                          <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{formatDateTime(user.creado, timezone)}</TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Switch checked={user.activo} disabled={togglingId === user.id} onCheckedChange={() => void handleToggleUser(user)} aria-label={`Activo ${userDisplayName(user)}`} />
                              <Badge variant={user.activo ? "default" : "secondary"}>{user.activo ? "Activo" : "Inactivo"}</Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {users.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted-foreground">No hay usuarios registrados.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="errores" className="mt-0">
          <Card className="overflow-hidden rounded-xl border-[#1b3148] bg-slate-950 text-[#d6deea]">
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Terminal className="size-4 text-[#7be0a7]" />
                <CardTitle className="text-base text-white">&gt;_ Consola del Servidor (Live Logs)</CardTitle>
                <span className="size-2 animate-pulse rounded-full bg-[#7be0a7]" aria-label="Servidor conectado" />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} aria-label="Activar auto-refresco cada 3 segundos" />
                  Auto-refresco cada 3s
                </label>
                <Button type="button" variant="outline" size="sm" onClick={() => void refreshLogs()} disabled={logsLoading} className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <RefreshCw className={`size-3.5 ${logsLoading ? "animate-spin" : ""}`} />
                  Refrescar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div ref={logsContainerRef} className="h-96 overflow-y-auto rounded-b-md bg-slate-950 p-4 font-mono text-xs leading-relaxed">
                {logsLoading && logs.length === 0 ? (
                  <p className="flex items-center gap-2 text-slate-400"><Loader2 className="size-4 animate-spin" /> Conectando con los logs del servidor...</p>
                ) : logs.length > 0 ? (
                  logs.map((line, index) => highlightLogLine(line, index))
                ) : (
                  <p className="text-slate-500">$ No hay logs disponibles.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={!!userDraft} onOpenChange={(open) => !open && !saving && setUserDraft(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo usuario</DialogTitle><DialogDescription>Registra un usuario administrativo y asígnale un rol.</DialogDescription></DialogHeader>
          {userDraft && <form className="grid gap-4 py-2" onSubmit={(event) => void handleSaveUser(event)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">Nombre<Input required value={userDraft.nombre} onChange={(event) => setUserDraft({ ...userDraft, nombre: event.target.value })} /></label>
              <label className="grid gap-1.5 text-sm font-medium">Apellido<Input required value={userDraft.apellido} onChange={(event) => setUserDraft({ ...userDraft, apellido: event.target.value })} /></label>
            </div>
            <label className="grid gap-1.5 text-sm font-medium">Correo<Input required type="email" value={userDraft.correo} onChange={(event) => setUserDraft({ ...userDraft, correo: event.target.value })} /></label>
            <label className="grid gap-1.5 text-sm font-medium">Contraseña inicial<Input required type="password" minLength={8} value={userDraft.password} onChange={(event) => setUserDraft({ ...userDraft, password: event.target.value })} /></label>
            <label className="grid gap-1.5 text-sm font-medium">Rol<select required value={userDraft.rol} onChange={(event) => setUserDraft({ ...userDraft, rol: event.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="" disabled>Selecciona un rol</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.nombre}</option>)}</select></label>
            <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => setUserDraft(null)}>Cancelar</Button><Button type="submit" disabled={!canSaveUser || saving}>{saving && <Loader2 className="size-4 animate-spin" />} Crear usuario</Button></DialogFooter>
          </form>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
