import { useState } from "react";
import { Download, Plus, Search } from "lucide-react";
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
import { reservas, usuarios } from "@/data2";
import {
  metodosPago as seedMetodos,
  pagosSeed,
  type MetodoPago,
  type Pago,
} from "@/data3";

const money = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const paymentVariant = (status: Pago["estado"]): BadgeProps["variant"] =>
  status === "APROBADO"
    ? "default"
    : status === "RECHAZADO"
      ? "destructive"
      : "secondary";
const userName = (id: number | null) =>
  id ? (usuarios.find((user) => user.id === id)?.nombre ?? "—") : "—";
const csvValue = (value: string | number) =>
  `"${String(value).replaceAll('"', '""')}"`;

function downloadPaymentsCsv(rows: Pago[], methodName: (id: number) => string) {
  const values = [
    ["id", "reserva", "metodo", "monto", "estado", "referencia", "fecha"],
    ...rows.map((payment) => [
      payment.id,
      payment.reserva,
      methodName(payment.metodo),
      payment.monto,
      payment.estado,
      payment.referencia ?? "",
      payment.fecha ?? "",
    ]),
  ];
  const csv = values.map((row) => row.map(csvValue).join(",")).join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "pagos.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Payments() {
  const [tab, setTab] = useState<"pagos" | "metodos">("pagos");
  const [payments, setPayments] = useState(pagosSeed);
  const [methods, setMethods] = useState(seedMetodos);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<Pago | null>(null);
  const [reject, setReject] = useState<Pago | null>(null);
  const [methodDraft, setMethodDraft] = useState<Partial<MetodoPago> | null>(
    null,
  );
  const methodName = (id: number) =>
    methods.find((method) => method.id === id)?.nombre ?? "—";
  const reservation = (id: number) => reservas.find((item) => item.id === id);
  const filteredPayments = payments.filter(
    (payment) =>
      (!status || payment.estado === status) &&
      `${payment.id} ${payment.reserva} ${payment.referencia ?? ""} ${methodName(payment.metodo)}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const visiblePayments = filteredPayments.slice(page * 6, page * 6 + 6);
  const sum = (paymentStatus: Pago["estado"]) =>
    payments
      .filter((payment) => payment.estado === paymentStatus)
      .reduce((total, payment) => total + payment.monto, 0);
  const totalPages = Math.ceil(filteredPayments.length / 6);

  const setPaymentState = (payment: Pago, nextStatus: Pago["estado"]) => {
    const nextPayment = {
      ...payment,
      estado: nextStatus,
      fecha: nextStatus === "APROBADO" ? "2026-10-15T13:45" : null,
      referencia:
        nextStatus === "APROBADO"
          ? `ANX-${payment.reserva}-${payment.id}`
          : payment.referencia,
    };
    setPayments((current) =>
      current.map((item) => (item.id === payment.id ? nextPayment : item)),
    );
    setDetail(nextPayment);
  };

  return (
    <div>
      <AppBreadcrumb
        items={[{ label: "Ventas", href: "/ventas" }, { label: "Pagos" }]}
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Pagos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conciliación de pagos de reservas y catálogo de métodos de pago.
          </p>
        </div>
        {tab === "pagos" ? (
          <Button
            onClick={() => downloadPaymentsCsv(filteredPayments, methodName)}
          >
            <Download className="size-4" /> Exportar CSV
          </Button>
        ) : (
          <Button onClick={() => setMethodDraft({ activo: true })}>
            <Plus className="size-4" /> Nuevo método
          </Button>
        )}
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {(["APROBADO", "PENDIENTE", "RECHAZADO"] as const).map(
          (paymentStatus) => (
            <Card key={paymentStatus}>
              <CardContent className="px-4 py-3">
                <div className="text-xs text-muted-foreground">
                  {paymentStatus === "APROBADO"
                    ? "Aprobado"
                    : paymentStatus === "PENDIENTE"
                      ? "Por conciliar"
                      : "Rechazado"}{" "}
                  ·{" "}
                  {
                    payments.filter(
                      (payment) => payment.estado === paymentStatus,
                    ).length
                  }{" "}
                  pagos
                </div>
                <div
                  className={`font-mono text-2xl font-medium ${paymentStatus === "APROBADO" ? "text-ok" : paymentStatus === "PENDIENTE" ? "text-warn" : "text-bad"}`}
                >
                  {money(sum(paymentStatus))}
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>
      <Card className="overflow-hidden rounded-xl">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as "pagos" | "metodos")}
        >
          <TabsList className="flex h-auto w-full justify-start rounded-none border-b border-border bg-card p-0">
            <TabsTrigger value="pagos" className="rounded-none px-4 py-3.5">
              Pagos{" "}
              <Badge variant="secondary" className="ml-1">
                {payments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="metodos" className="rounded-none px-4 py-3.5">
              Métodos de pago{" "}
              <Badge variant="secondary" className="ml-1">
                {methods.length}
              </Badge>
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
                  placeholder="Referencia, reserva o método"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(0);
                  }}
                />
              </div>
              <select
                className="h-9 w-auto rounded-md border border-input bg-background px-3 text-sm"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(0);
                }}
                aria-label="Estado"
              >
                <option value="">Todos los estados</option>
                {["PENDIENTE", "APROBADO", "RECHAZADO"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-[1040px]">
                <TableHeader>
                  <TableRow className="bg-background">
                    {[
                      "Pago",
                      "Reserva",
                      "Cliente",
                      "Método",
                      "Monto",
                      "Estado",
                      "Referencia",
                      "Fecha de pago",
                      "Registrado por",
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
                  {visiblePayments.map((payment) => (
                    <TableRow
                      key={payment.id}
                      onClick={() => setDetail(payment)}
                      className="cursor-pointer"
                    >
                      <TableCell className="px-4 py-3 font-mono font-medium">
                        #{payment.id}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-mono">
                        #{payment.reserva}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {reservation(payment.reserva)?.cliente ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {methodName(payment.metodo)}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-mono">
                        {money(payment.monto)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant={paymentVariant(payment.estado)}>
                          {payment.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs">
                        {payment.referencia ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs">
                        {payment.fecha?.replace("T", " ") ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {userName(payment.creadoPor)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {visiblePayments.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        Sin pagos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
              <span>{filteredPayments.length} pagos</span>
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
          </>
        )}
        {tab === "metodos" && (
          <div className="overflow-x-auto">
            <Table className="min-w-[620px]">
              <TableHeader>
                <TableRow className="bg-background">
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                    Método de pago
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                    Pagos registrados
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                    Activo
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="px-4 py-3 font-medium">
                      {method.nombre}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono">
                      {
                        payments.filter(
                          (payment) => payment.metodo === method.id,
                        ).length
                      }
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={method.activo}
                          onCheckedChange={(active) =>
                            setMethods((current) =>
                              current.map((item) =>
                                item.id === method.id
                                  ? { ...item, activo: active }
                                  : item,
                              ),
                            )
                          }
                          aria-label={`Activo ${method.nombre}`}
                        />
                        <Badge
                          variant={method.activo ? "default" : "secondary"}
                        >
                          {method.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pago #{detail?.id}</DialogTitle>
            <DialogDescription>
              Reserva #{detail?.reserva} ·{" "}
              {detail && reservation(detail.reserva)?.cliente}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-3xl font-medium">
                  {money(detail.monto)}
                </span>
                <Badge variant={paymentVariant(detail.estado)}>
                  {detail.estado}
                </Badge>
              </div>
              <dl className="divide-y divide-border text-sm">
                {[
                  ["Método", methodName(detail.metodo)],
                  ["Referencia", detail.referencia ?? "—"],
                  ["Fecha de pago", detail.fecha?.replace("T", " ") ?? "—"],
                  ["Registrado por", userName(detail.creadoPor)],
                  ["Eliminado por", userName(detail.eliminadoPor)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 py-2.5"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-mono">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          {detail?.estado === "PENDIENTE" ? (
            <DialogFooter>
              <Button variant="outline" onClick={() => setReject(detail)}>
                Rechazar
              </Button>
              <Button onClick={() => setPaymentState(detail, "APROBADO")}>
                Aprobar pago
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button onClick={() => setDetail(null)}>Cerrar</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!reject} onOpenChange={(open) => !open && setReject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Rechazar el pago #{reject?.id}?</DialogTitle>
            <DialogDescription>
              La reserva volverá a quedar pendiente hasta su expiración y el
              pasajero no recibirá boletos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReject(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (reject) setPaymentState(reject, "RECHAZADO");
                setReject(null);
              }}
            >
              Sí, rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!methodDraft}
        onOpenChange={(open) => !open && setMethodDraft(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo método de pago</DialogTitle>
            <DialogDescription>Tabla Metodo_pago</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <label className="grid gap-1.5 text-sm font-medium">
              <span>Nombre</span>
              <Input
                value={methodDraft?.nombre ?? ""}
                onChange={(event) =>
                  setMethodDraft({ ...methodDraft, nombre: event.target.value })
                }
              />
            </label>
            <div className="flex items-center justify-between rounded-lg bg-background p-4">
              <div>
                <div className="text-sm font-medium">Método activo</div>
                <div className="text-xs text-muted-foreground">
                  Solo los activos se ofrecen al registrar pagos.
                </div>
              </div>
              <Switch
                checked={!!methodDraft?.activo}
                onCheckedChange={(active) =>
                  setMethodDraft({ ...methodDraft, activo: active })
                }
                aria-label="Método activo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMethodDraft(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!methodDraft?.nombre?.trim()}
              onClick={() => {
                setMethods((current) => [
                  ...current,
                  {
                    id: Date.now(),
                    nombre: methodDraft!.nombre!.trim(),
                    activo: !!methodDraft!.activo,
                  },
                ]);
                setMethodDraft(null);
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
