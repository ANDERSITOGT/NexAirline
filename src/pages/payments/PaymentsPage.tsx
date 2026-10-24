import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
import {
  getPayments,
  updatePaymentStatus,
  type PagoItem,
  type PaymentStatus,
  type ResumenFinanciero,
} from "@/services/paymentService";
import {
  getPaymentMethods,
  togglePaymentMethod,
  type MetodoPago,
} from "@/services/paymentMethodService";
import { formatDateTime } from "@/utils/dateUtils";
import { usePreferences } from "@/contexts/usePreferences";

const PAGE_SIZE = 6;
const EMPTY_SUMMARY: ResumenFinanciero = {
  aprobado_monto: 0,
  aprobado_conteo: 0,
  pendiente_monto: 0,
  pendiente_conteo: 0,
  rechazado_monto: 0,
  rechazado_conteo: 0,
};

const money = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const paymentVariant = (status: PaymentStatus): BadgeProps["variant"] =>
  status === "APROBADO"
    ? "default"
    : status === "RECHAZADO"
      ? "destructive"
      : "secondary";

const csvValue = (value: string | number) =>
  `"${String(value).replaceAll('"', '""')}"`;

function downloadPaymentsCsv(rows: PagoItem[], timezone: string) {
  const values = [
    ["id", "reserva", "cliente", "metodo", "monto", "estado", "referencia", "fecha", "registrado_por"],
    ...rows.map((payment) => [
      payment.id,
      payment.codigo_reserva ?? payment.reserva_id,
      payment.cliente_nombre,
      payment.metodo_pago,
      payment.monto,
      payment.estado,
      payment.referencia ?? "",
      formatDateTime(payment.fecha_pago, timezone),
      payment.registrado_por,
    ]),
  ];
  const csv = values.map((row) => row.map(csvValue).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "pagos.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function monthOptions(timezone: string) {
  const formatter = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: timezone });
  const current = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(current.getFullYear(), current.getMonth() - index, 1);
    return {
      value: new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: timezone }).format(date),
      label: formatter.format(date).replace(/^\w/, (letter) => letter.toUpperCase()),
    };
  });
}

export default function Payments() {
  const { timezone } = usePreferences();
  const [tab, setTab] = useState<"pagos" | "metodos">("pagos");
  const [payments, setPayments] = useState<PagoItem[]>([]);
  const [methods, setMethods] = useState<MetodoPago[]>([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [status, setStatus] = useState("TODOS");
  const [periodo, setPeriodo] = useState(() => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit" }).format(new Date()));
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [methodsError, setMethodsError] = useState("");
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [updatingMethodId, setUpdatingMethodId] = useState<number | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PagoItem | null>(null);
  const periods = useMemo(() => monthOptions(timezone), [timezone]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query), 400);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getPayments({
        page,
        limit: PAGE_SIZE,
        q: debouncedQuery,
        estado: status,
        periodo,
      });
      setPayments(response.data);
      setSummary(response.resumen);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los pagos.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, periodo, status]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchPagos();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchPagos]);

  useEffect(() => {
    const loadMethods = async () => {
      setMethodsLoading(true);
      setMethodsError("");
      try {
        setMethods(await getPaymentMethods());
      } catch (cause) {
        setMethodsError(
          cause instanceof Error ? cause.message : "No se pudieron cargar los métodos de pago.",
        );
      } finally {
        setMethodsLoading(false);
      }
    };
    void loadMethods();
  }, []);

  const handleMethodToggle = async (method: MetodoPago) => {
    setUpdatingMethodId(method.id);
    setMethodsError("");
    try {
      const updated = await togglePaymentMethod(method.id);
      setMethods((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (cause) {
      setMethodsError(
        cause instanceof Error ? cause.message : "No se pudo actualizar el método de pago.",
      );
    } finally {
      setUpdatingMethodId(null);
    }
  };

  const handlePaymentStatus = async (payment: PagoItem, estado: "APROBADO" | "RECHAZADO") => {
    setUpdatingPaymentId(payment.id);
    setError("");
    try {
      await updatePaymentStatus(payment.id, estado);
      setDetail(null);
      await fetchPagos();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el estado del pago.");
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div>
      <AppBreadcrumb items={[{ label: "Ventas", href: "/ventas" }, { label: "Pagos" }]} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pagos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conciliación de pagos de reservas y catálogo de métodos de pago.
          </p>
        </div>
        {tab === "pagos" ? (
          <Button onClick={() => downloadPaymentsCsv(payments, timezone)}>
            <Download className="size-4" /> Exportar CSV
          </Button>
        ) : null}
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Aprobado", summary.aprobado_monto, summary.aprobado_conteo, "text-ok"],
          ["Por conciliar", summary.pendiente_monto, summary.pendiente_conteo, "text-warn"],
          ["Rechazado", summary.rechazado_monto, summary.rechazado_conteo, "text-bad"],
        ].map(([label, amount, count, color]) => (
          <Card key={label}>
            <CardContent className="px-4 py-3">
              <div className="text-xs text-muted-foreground">{label} · {count} pagos</div>
              <div className={`font-mono text-2xl font-medium ${color}`}>{money(Number(amount))}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden rounded-xl">
        <Tabs value={tab} onValueChange={(value) => setTab(value as "pagos" | "metodos")}>
          <TabsList className="flex h-auto w-full justify-start rounded-none border-b border-border bg-card p-0">
            <TabsTrigger value="pagos" className="rounded-none px-4 py-3.5">
              Pagos <Badge variant="secondary" className="ml-1">{total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="metodos" className="rounded-none px-4 py-3.5">
              Métodos de pago <Badge variant="secondary" className="ml-1">{methods.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === "pagos" && (
          <>
            <div className="flex flex-wrap gap-3 border-b border-border p-4">
              <div className="relative min-w-52 flex-1 md:max-w-xs">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-9"
                  placeholder="Referencia, reserva o cliente"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select value={status} onValueChange={(value) => updateFilter(setStatus, value)}>
                <SelectTrigger className="h-9 w-auto" aria-label="Estado">
                  <SelectContent>
                    <SelectItem value="TODOS">Todos los estados</SelectItem>
                    <SelectItem value="APROBADO">APROBADO</SelectItem>
                    <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                    <SelectItem value="RECHAZADO">RECHAZADO</SelectItem>
                  </SelectContent>
                </SelectTrigger>
              </Select>
              <Select value={periodo} onValueChange={(value) => updateFilter(setPeriodo, value)}>
                <SelectTrigger className="h-9 w-auto min-w-44" aria-label="Periodo">
                  <SelectContent>
                    {periods.map((period) => <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>)}
                    <SelectItem value="todos">Todos los periodos</SelectItem>
                  </SelectContent>
                </SelectTrigger>
              </Select>
            </div>
            {error && <p className="border-b border-bad/30 bg-bad-bg px-4 py-3 text-sm text-bad">{error}</p>}
            <div className="overflow-x-auto">
              <Table className="min-w-[1040px]">
                <TableHeader>
                  <TableRow className="bg-background">
                    {["Pago", "Reserva", "Cliente", "Método", "Monto", "Estado", "Referencia", "Fecha de pago", "Registrado por"].map((heading) => (
                      <TableHead key={heading} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">{heading}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="px-4 py-12 text-center text-muted-foreground">Cargando pagos...</TableCell></TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="px-4 py-12 text-center text-muted-foreground">Sin pagos.</TableCell></TableRow>
                  ) : payments.map((payment) => (
                    <TableRow key={payment.id} onClick={() => setDetail(payment)} className="cursor-pointer">
                      <TableCell className="px-4 py-3 font-mono font-medium">#{payment.id}</TableCell>
                      <TableCell className="px-4 py-3 font-mono">{payment.codigo_reserva ?? `#${payment.reserva_id}`}</TableCell>
                      <TableCell className="px-4 py-3">{payment.cliente_nombre}</TableCell>
                      <TableCell className="px-4 py-3">{payment.metodo_pago}</TableCell>
                      <TableCell className="px-4 py-3 font-mono">{money(payment.monto)}</TableCell>
                      <TableCell className="px-4 py-3"><Badge variant={paymentVariant(payment.estado)}>{payment.estado}</Badge></TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs">{payment.referencia ?? "—"}</TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs">{formatDateTime(payment.fecha_pago, timezone)}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{payment.registrado_por}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
              <span>Página {page} de {totalPages} ({total} pagos en total)</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
              </div>
            </div>
          </>
        )}
        {tab === "metodos" && (
          <div className="overflow-x-auto">
            {methodsError && <p className="border-b border-bad/30 bg-bad-bg px-4 py-3 text-sm text-bad">{methodsError}</p>}
            <Table className="min-w-[620px]">
              <TableHeader><TableRow className="bg-background"><TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Método de pago</TableHead><TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Activo</TableHead></TableRow></TableHeader>
              <TableBody>{methodsLoading ? (
                <TableRow><TableCell colSpan={2} className="px-4 py-12 text-center text-muted-foreground">Cargando métodos de pago...</TableCell></TableRow>
              ) : methods.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="px-4 py-12 text-center text-muted-foreground">Sin métodos de pago.</TableCell></TableRow>
              ) : methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="px-4 py-3 font-medium">{method.nombre}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Switch checked={method.activo} disabled={updatingMethodId === method.id} onCheckedChange={() => void handleMethodToggle(method)} aria-label={`Activo ${method.nombre}`} />
                      <Badge variant={method.activo ? "default" : "secondary"}>{method.activo ? "Activo" : "Inactivo"}</Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        )}
      </Card>
      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pago #{detail?.id}</DialogTitle>
            <DialogDescription>Reserva {detail?.codigo_reserva ?? `#${detail?.reserva_id}`} · {detail?.cliente_nombre}</DialogDescription>
          </DialogHeader>
          {detail && (
            <>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-3xl font-medium">{money(detail.monto)}</span>
                <Badge variant={paymentVariant(detail.estado)}>{detail.estado}</Badge>
              </div>
              <dl className="divide-y divide-border text-sm">
                {                [["Método", detail.metodo_pago], ["Referencia", detail.referencia ?? "—"], ["Fecha de pago", formatDateTime(detail.fecha_pago, timezone)], ["Registrado por", detail.registrado_por]].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-2.5"><dt className="text-muted-foreground">{label}</dt><dd className="font-mono">{value}</dd></div>
                ))}
              </dl>
              {detail.estado === "PENDIENTE" && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="destructive"
                    disabled={updatingPaymentId === detail.id}
                    onClick={() => void handlePaymentStatus(detail, "RECHAZADO")}
                  >
                    Rechazar
                  </Button>
                  <Button
                    className="bg-ok text-white hover:bg-ok/90"
                    disabled={updatingPaymentId === detail.id}
                    onClick={() => void handlePaymentStatus(detail, "APROBADO")}
                  >
                    Aprobar
                  </Button>
                </div>
              )}
            </>
          )}
          <DialogFooter><Button onClick={() => setDetail(null)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
