import { useState } from "react";
import { ArrowRight, Download, Search } from "lucide-react";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usuarios } from "@/data2";
import { bitacora, type Bitacora } from "@/data3";
import { usePreferences } from "@/contexts/usePreferences";
import { formatDateTime } from "@/utils/dateUtils";

const states = [
  "DISPONIBLE",
  "RESERVADO_TEMPORAL",
  "CONFIRMADO",
  "BLOQUEADO",
  "CHECKED_IN",
] as const;
const badgeVariant = (state: string): BadgeProps["variant"] =>
  state === "BLOQUEADO"
    ? "destructive"
    : state === "CHECKED_IN"
      ? "default"
      : state === "RESERVADO_TEMPORAL"
        ? "secondary"
        : "outline";
const csvValue = (value: string | number) =>
  `"${String(value).replaceAll('"', '""')}"`;

function downloadCsv(
  rows: Bitacora[],
  userName: (id: number | null) => string,
  timezone: string,
) {
  const values = [
    [
      "id",
      "fecha",
      "vuelo",
      "asiento",
      "anterior",
      "nuevo",
      "usuario",
      "descripcion",
    ],
    ...rows.map((entry) => [
      entry.id,
      formatDateTime(entry.fecha, timezone),
      entry.vuelo,
      entry.asiento,
      entry.anterior ?? "",
      entry.nuevo,
      userName(entry.usuario),
      entry.descripcion,
    ]),
  ];
  const csv = values.map((row) => row.map(csvValue).join(",")).join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "bitacora_asientos.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Audit() {
  const { timezone } = usePreferences();
  const [query, setQuery] = useState("");
  const [newState, setNewState] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [page, setPage] = useState(0);
  const userName = (id: number | null) =>
    id ? (usuarios.find((user) => user.id === id)?.nombre ?? "—") : "Sistema";
  const filteredRows = bitacora.filter(
    (entry) =>
      (!newState || entry.nuevo === newState) &&
      (!userFilter ||
        (userFilter === "0"
          ? entry.usuario === null
          : entry.usuario === Number(userFilter))) &&
      `${entry.vuelo} ${entry.asiento} ${entry.descripcion}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const visibleRows = filteredRows.slice(page * 8, page * 8 + 8);
  const totalPages = Math.ceil(filteredRows.length / 8);
  const reset = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(0);
  };

  return (
    <div>
      <AppBreadcrumb
        items={[{ label: "Seguridad", href: "/seguridad" }, { label: "Bitácora de asientos" }]}
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Bitácora de asientos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Historial de cambios de estado en Vuelo_asiento.
          </p>
        </div>
        <Button onClick={() => downloadCsv(filteredRows, userName, timezone)}>
          <Download className="size-4" /> Exportar CSV
        </Button>
      </div>
      <Card className="overflow-hidden rounded-xl">
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-3 border-b border-border p-4">
            <div className="relative min-w-52 flex-1 md:max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-9"
                placeholder="Vuelo, asiento o descripción"
                value={query}
                onChange={(event) => reset(setQuery, event.target.value)}
              />
            </div>
            <select
              className="h-9 w-auto rounded-md border border-input bg-background px-3 text-sm"
              value={newState}
              onChange={(event) => reset(setNewState, event.target.value)}
              aria-label="Estado nuevo"
            >
              <option value="">Cualquier estado nuevo</option>
              {states.map((state) => (
                <option key={state}>{state}</option>
              ))}
            </select>
            <select
              className="h-9 w-auto rounded-md border border-input bg-background px-3 text-sm"
              value={userFilter}
              onChange={(event) => reset(setUserFilter, event.target.value)}
              aria-label="Usuario"
            >
              <option value="">Todos los usuarios</option>
              <option value="0">Sistema</option>
              {usuarios.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow className="bg-background">
                  {[
                    "#",
                    "Fecha",
                    "Vuelo · asiento",
                    "Cambio de estado",
                    "Usuario",
                    "Descripción",
                  ].map((heading) => (
                    <TableHead
                      key={heading}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    >
                      {heading}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {entry.id}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs">
                      {formatDateTime(entry.fecha, timezone)}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono font-medium">
                      {entry.vuelo} · {entry.asiento}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        {entry.anterior ? (
                          <Badge variant={badgeVariant(entry.anterior)}>
                            {entry.anterior}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            (nuevo)
                          </span>
                        )}
                        <ArrowRight className="size-3.5 text-muted-foreground" />
                        <Badge variant={badgeVariant(entry.nuevo)}>
                          {entry.nuevo}
                        </Badge>
                      </span>
                    </TableCell>
                    <TableCell
                      className={`px-4 py-3 ${entry.usuario ? "" : "text-muted-foreground"}`}
                    >
                      {userName(entry.usuario)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {entry.descripcion}
                    </TableCell>
                  </TableRow>
                ))}
                {visibleRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      Sin movimientos con esos filtros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>{filteredRows.length} movimientos</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((current) => current - 1)}
              >
                Anterior
              </Button>
              <span className="font-mono text-xs">
                {totalPages === 0 ? 0 : page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
