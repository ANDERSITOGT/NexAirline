import { useState } from "react";
import { Plus, Terminal } from "lucide-react";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Badge, type BadgeProps } from "@/components/ui/badge";
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
import { errores, roles, usuarios as seedUsers, type Usuario } from "@/data2";

type SecurityTab = "usuarios" | "errores";
type UserDraft = Pick<Usuario, "nombre" | "correo" | "rol"> & {
  activo: boolean;
};
const blankUser: UserDraft = {
  nombre: "",
  correo: "",
  rol: roles[0].id,
  activo: true,
};

const errorVariant = (type: string): BadgeProps["variant"] =>
  type === "DatabaseError" || type === "TimeoutError"
    ? "destructive"
    : type === "ValidationError"
      ? "secondary"
      : "outline";
const errorColor: Record<string, string> = {
  DatabaseError: "text-red-300",
  ValidationError: "text-amber-300",
  AuthError: "text-blue-300",
  TimeoutError: "text-violet-300",
};

export default function Security() {
  const [tab, setTab] = useState<SecurityTab>("usuarios");
  const [users, setUsers] = useState(seedUsers);
  const [type, setType] = useState("");
  const [selectedError, setSelectedError] = useState<number | null>(
    errores[0]?.id ?? null,
  );
  const [userDraft, setUserDraft] = useState<UserDraft | null>(null);
  const logs = errores.filter((error) => !type || error.tipo === type);
  const detail = errores.find((error) => error.id === selectedError);
  const activeUsers = users.filter((user) => user.activo).length;
  const updateUser = (id: number, patch: Partial<Usuario>) =>
    setUsers((current) =>
      current.map((user) => (user.id === id ? { ...user, ...patch } : user)),
    );
  const canSaveUser =
    !!userDraft?.nombre.trim() &&
    userDraft.correo.includes("@") &&
    !!userDraft.rol;

  const saveUser = () => {
    if (!userDraft || !canSaveUser) return;
    setUsers((current) => [
      ...current,
      { ...userDraft, id: Date.now(), creado: "2026-10-15" },
    ]);
    setUserDraft(null);
  };

  return (
    <div>
      <AppBreadcrumb
        items={[{ label: "Seguridad", href: "/seguridad" }, { label: "Roles y errores" }]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Seguridad y sistema
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Asignación de roles a usuarios administrativos y registro de errores.
        </p>
      </div>
      <Tabs value={tab} onValueChange={(value) => setTab(value as SecurityTab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="usuarios">Usuarios y roles</TabsTrigger>
          <TabsTrigger value="errores">
            Consola de errores{" "}
            <Badge variant="secondary" className="ml-1">
              {errores.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios" className="mt-0">
          <Card className="overflow-hidden rounded-xl">
            <CardHeader className="flex-row items-center justify-between border-b border-border">
              <div>
                <CardTitle className="text-base">Usuarios y roles</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {activeUsers} de {users.length} usuarios activos
                </p>
              </div>
              <Button onClick={() => setUserDraft({ ...blankUser })}>
                <Plus className="size-4" /> Nuevo usuario
              </Button>
            </CardHeader>
            <div className="grid gap-px border-b border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="bg-background px-4 py-3"
                  title={role.descripcion}
                >
                  <div className="font-mono text-xl font-medium">
                    {users.filter((user) => user.rol === role.id).length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {role.nombre}
                  </div>
                </div>
              ))}
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow className="bg-background">
                      <TableHead className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">
                        Usuario
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                        Rol
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                        Creado
                      </TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                        Estado
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user.id}
                        className={user.activo ? "" : "opacity-60"}
                      >
                        <TableCell className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                              {user.nombre
                                .split(" ")
                                .map((name) => name[0])
                                .join("")}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">
                                {user.nombre}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {user.correo}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <select
                            aria-label={`Rol de ${user.nombre}`}
                            value={user.rol}
                            onChange={(event) =>
                              updateUser(user.id, {
                                rol: Number(event.target.value),
                              })
                            }
                            className="h-9 w-44 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.nombre}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {user.creado}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={user.activo}
                              onCheckedChange={(active) =>
                                updateUser(user.id, { activo: active })
                              }
                              aria-label={`Activo ${user.nombre}`}
                            />
                            <Badge
                              variant={user.activo ? "default" : "secondary"}
                            >
                              {user.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="errores" className="mt-0">
          <Card className="overflow-hidden rounded-xl border-[#1b3148] bg-[#0b1624] text-[#d6deea]">
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Terminal className="size-4 text-[#7be0a7]" />
                <CardTitle className="text-base text-white">
                  Registro de errores
                </CardTitle>
                <span className="size-2 animate-pulse rounded-full bg-[#7be0a7]" />
              </div>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                aria-label="Filtrar por tipo"
                className="h-8 rounded border border-white/15 bg-transparent px-2 font-mono text-xs text-white"
              >
                <option value="" className="text-black">
                  todos
                </option>
                {Object.keys(errorColor).map((item) => (
                  <option key={item} className="text-black">
                    {item}
                  </option>
                ))}
              </select>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 overflow-auto">
                <Table className="min-w-[780px] font-mono text-xs">
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="px-5 py-2 text-white/45">
                        Fecha
                      </TableHead>
                      <TableHead className="px-4 py-2 text-white/45">
                        Tipo
                      </TableHead>
                      <TableHead className="px-4 py-2 text-white/45">
                        Mensaje
                      </TableHead>
                      <TableHead className="px-4 py-2 text-white/45">
                        Ruta
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((error) => (
                      <TableRow
                        key={error.id}
                        onClick={() => setSelectedError(error.id)}
                        className={`cursor-pointer border-white/10 hover:bg-white/5 ${selectedError === error.id ? "bg-white/10" : ""}`}
                      >
                        <TableCell className="px-5 py-2 text-white/45">
                          {error.fecha.slice(5)}
                        </TableCell>
                        <TableCell
                          className={`px-4 py-2 ${errorColor[error.tipo] ?? "text-white"}`}
                        >
                          <Badge
                            variant={errorVariant(error.tipo)}
                            className="font-mono"
                          >
                            {error.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-2 text-white/90">
                          {error.mensaje}
                        </TableCell>
                        <TableCell className="px-4 py-2 text-white/55">
                          {error.path}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {logs.length === 0 && (
                  <p className="px-5 py-6 font-mono text-xs text-white/50">
                    $ sin registros para este filtro
                  </p>
                )}
              </div>
              {detail && (
                <div className="border-t border-white/10 px-5 py-4 font-mono text-xs leading-relaxed">
                  <div className="text-white/45">
                    #{detail.id} · {detail.path}
                  </div>
                  <div className="mt-1 break-words text-white/85">
                    {detail.detalle}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog
        open={!!userDraft}
        onOpenChange={(open) => !open && setUserDraft(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Registra un usuario administrativo y asígnale un rol.
            </DialogDescription>
          </DialogHeader>
          {userDraft && (
            <div className="grid gap-4 py-2">
              <label className="grid gap-1.5 text-sm font-medium">
                <span>Nombre completo</span>
                <Input
                  value={userDraft.nombre}
                  onChange={(event) =>
                    setUserDraft({ ...userDraft, nombre: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                <span>Correo electrónico</span>
                <Input
                  type="email"
                  value={userDraft.correo}
                  onChange={(event) =>
                    setUserDraft({ ...userDraft, correo: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                <span>Rol</span>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={userDraft.rol}
                  onChange={(event) =>
                    setUserDraft({
                      ...userDraft,
                      rol: Number(event.target.value),
                    })
                  }
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center justify-between rounded-lg bg-background p-4">
                <span className="text-sm font-medium">Usuario activo</span>
                <Switch
                  checked={userDraft.activo}
                  onCheckedChange={(active) =>
                    setUserDraft({ ...userDraft, activo: active })
                  }
                  aria-label="Usuario activo"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDraft(null)}>
              Cancelar
            </Button>
            <Button disabled={!canSaveUser} onClick={saveUser}>
              Registrar usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
