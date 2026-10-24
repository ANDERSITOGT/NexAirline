import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { Loader2, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  crearVentaMostrador,
  createCliente,
  liberarTemporal,
  searchClientes,
  type Cliente,
  type MetodoPago,
  type VentaMostradorPayload,
  type VentaMostradorResponse,
} from "@/services/despachoService";
import { getPaymentMethods } from "@/services/paymentMethodService";

type CustomerForm = { nombre: string; apellido: string; correo: string; telefono: string };
type PassengerForm = { nombre: string; apellido: string; tipo_documento: string; numero_documento: string };

const emptyCustomer: CustomerForm = { nombre: "", apellido: "", correo: "", telefono: "" };
const emptyPassenger: PassengerForm = { nombre: "", apellido: "", tipo_documento: "", numero_documento: "" };
const capitalizeName = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());

export function EmergencySaleDialog({
  open,
  vueloId,
  flightNumber,
  seatId,
  seatLabel,
  seatClass,
  price,
  onOpenChange,
  onReleased,
  onCompleted,
  onError,
}: {
  open: boolean;
  vueloId: number;
  flightNumber: string;
  seatId: number;
  seatLabel: string;
  seatClass: string;
  price: number;
  onOpenChange: (open: boolean) => void;
  onReleased: () => void;
  onCompleted: (response: VentaMostradorResponse) => void;
  onError: (message: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState<CustomerForm>(emptyCustomer);
  const [passenger, setPassenger] = useState<PassengerForm>(emptyPassenger);
  const [selectedCustomer, setSelectedCustomer] = useState<Cliente | null>(null);
  const [newCustomer, setNewCustomer] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Cliente[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sameCustomer, setSameCustomer] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<MetodoPago[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [busy, setBusy] = useState(false);
  const [reserved, setReserved] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(180);
  const [ticketResponse, setTicketResponse] = useState<VentaMostradorResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    void getPaymentMethods()
      .then((methods) => {
        const activeMethods = methods.filter((method) => method.activo !== false);
        setPaymentMethods(activeMethods);
        setPaymentMethodId("");
      })
      .catch((cause) => {
        onError(cause instanceof Error ? cause.message : "No se pudieron cargar los métodos de pago.");
      });
  }, [open, onError]);

  useEffect(() => {
    if (!open || !reserved) return;
    const timeoutId = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timeoutId);
          void liberarTemporal(seatId)
            .then(() => {
              onReleased();
              onError("El tiempo de reserva ha expirado");
              onOpenChange(false);
            })
            .catch((cause) => onError(cause instanceof Error ? cause.message : "No se pudo liberar el asiento temporal."));
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timeoutId);
  }, [onError, onOpenChange, onReleased, open, reserved, seatId]);

  useEffect(() => {
    if (!open || newCustomer || query.trim().length < 2) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      void searchClientes(query.trim())
        .then(setMatches)
        .catch((cause) => {
          setMatches([]);
          onError(cause instanceof Error ? cause.message : "No se pudieron buscar clientes.");
        })
        .finally(() => setIsSearching(false));
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [newCustomer, onError, open, query]);

  const close = async () => {
    if (reserved) {
      try {
        await liberarTemporal(seatId);
        onReleased();
      } catch (cause) {
        onError(cause instanceof Error ? cause.message : "No se pudo liberar el asiento temporal.");
      }
    }
    onOpenChange(false);
  };

  const chooseCustomer = (item: Cliente) => {
    setSelectedCustomer(item);
    setCustomer({
      nombre: item.nombre,
      apellido: item.apellido ?? "",
      correo: item.correo ?? "",
      telefono: item.telefono ?? "",
    });
    setQuery(`${item.nombre} ${item.apellido ?? ""}`.trim());
    setMatches([]);
  };

  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
    setCustomer(emptyCustomer);
    setQuery("");
    setNewCustomer(false);
    setCustomerError("");
  };

  const saveNewCustomer = async () => {
    const nombre = customer.nombre.trim();
    const apellido = customer.apellido.trim();
    const correo = customer.correo.trim();
    const telefono = customer.telefono.trim();
    if (!nombre || !apellido || !correo) {
      setCustomerError("Nombre, apellido y correo son obligatorios.");
      return;
    }

    setSavingCustomer(true);
    setCustomerError("");
    try {
      const createdCustomer = await createCliente({
        nombre,
        apellido,
        correo,
        ...(telefono ? { telefono } : {}),
        contrasena: "Nex#2026Temp",
      });
      setSelectedCustomer(createdCustomer);
      setCustomer({ nombre, apellido, correo, telefono });
      setNewCustomer(false);
      setQuery(`${createdCustomer.nombre} ${createdCustomer.apellido ?? ""}`.trim());
    } catch (cause) {
      setCustomerError(cause instanceof Error ? cause.message : "No se pudo registrar el cliente.");
    } finally {
      setSavingCustomer(false);
    }
  };

  const updateSameCustomer = (checked: boolean | "indeterminate") => {
    const value = checked === true;
    setSameCustomer(value);
    if (value) {
      setPassenger({
        nombre: customer.nombre,
        apellido: customer.apellido,
        tipo_documento: "",
        numero_documento: "",
      });
    }
  };

  const issueTicket = async () => {
    const selectedMethod = paymentMethods.find((method) => String(method.id) === paymentMethodId);
    const methodName = selectedMethod?.nombre.toLowerCase() ?? "";
    const isCardPayment = methodName.includes("tarjeta")
      || methodName.includes("visa")
      || methodName.includes("card")
      || methodName.includes("credito")
      || methodName.includes("crédito")
      || methodName.includes("debito")
      || methodName.includes("débito");
    const reference = isCardPayment
      ? `VISA-SIM-${Date.now()}`
      : methodName.includes("efectivo")
        ? `EFECTIVO-MOSTRADOR-${Date.now()}`
        : `PAGO-MOSTRADOR-${Date.now()}`;

    setBusy(true);
    if (!selectedCustomer) {
      onError("Selecciona o registra un cliente antes de emitir el boleto.");
      return;
    }

    const payload: VentaMostradorPayload = {
      vuelo_id: vueloId,
      vuelo_asiento_id: seatId,
      cliente_id: selectedCustomer.id,
      pasajero: {
        nombre: passenger.nombre.trim(),
        apellido: passenger.apellido.trim(),
        tipo_documento: passenger.tipo_documento,
        numero_documento: passenger.numero_documento.trim(),
      },
      pago: {
        metodo_pago_id: Number(paymentMethodId),
        monto: price,
        referencia: reference,
      },
    };
    try {
      const response = await crearVentaMostrador(payload);
      setReserved(false);
      setTicketResponse(response);
      setStep(4);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "No se pudo emitir el boleto.");
    } finally {
      setBusy(false);
    }
  };

  const documentNumber = passenger.numero_documento.trim();
  const canNext = step === 1
    ? Boolean(selectedCustomer)
    : Boolean(
      passenger.nombre.trim()
      && passenger.apellido.trim()
      && passenger.tipo_documento.trim()
      && (
        passenger.tipo_documento === "DPI"
          ? /^\d{8,13}$/.test(documentNumber)
          : passenger.tipo_documento === "DNI"
            ? /^\d{1,10}$/.test(documentNumber)
            : /^[A-Z0-9]{1,12}$/.test(documentNumber)
      ),
    );
  const handleStepKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && canNext && step < 3) {
      event.preventDefault();
      setStep((current) => current + 1);
    }
  };
  const selectedMethod = paymentMethods.find((method) => String(method.id) === paymentMethodId);
  const selectedMethodName = selectedMethod?.nombre.toLowerCase() ?? "";
  const isCardPayment = selectedMethodName.includes("tarjeta")
    || selectedMethodName.includes("visa")
    || selectedMethodName.includes("card")
    || selectedMethodName.includes("credito")
    || selectedMethodName.includes("crédito")
    || selectedMethodName.includes("debito")
    || selectedMethodName.includes("débito");
  const canPay = Boolean(
    paymentMethodId
    && (!isCardPayment || (cardNumber.length === 8 && cardExpiry.length === 5 && cardCvv.length === 3)),
  );
  const formattedTime = `${String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:${String(secondsRemaining % 60).padStart(2, "0")}`;
  const ticketNumber = ticketResponse?.boleto?.numero_boleto
    ?? ticketResponse?.numero_boleto
    ?? ticketResponse?.boleto?.numero
    ?? "—";
  const checkInCode = ticketResponse?.boleto?.codigo_checkin
    || ticketResponse?.codigo_checkin
    || ticketResponse?.data?.codigo_checkin
    || "—";

  const printTicket = () => {
    if (!ticketResponse) return;
    const printWindow = window.open("", "_blank", "width=420,height=700");
    if (!printWindow) {
      onError("No se pudo abrir la ventana de impresión. Permite ventanas emergentes e inténtalo de nuevo.");
      return;
    }
    const escapeHtml = (value: string) => value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    const passengerName = capitalizeName(`${passenger.nombre.trim()} ${passenger.apellido.trim()}`);
    printWindow.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Boleto ${escapeHtml(ticketNumber)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #172033; }
            h1 { font-size: 20px; margin: 0 0 20px; }
            .label { color: #64748b; font-size: 11px; text-transform: uppercase; }
            .value { font-size: 15px; margin: 3px 0 14px; }
            .total { border-top: 1px solid #cbd5e1; padding-top: 14px; font-weight: bold; }
            @media print { body { margin: 12mm; } }
          </style>
        </head>
        <body>
          <h1>airINex · Pase de Abordar y Comprobante</h1>
          <div class="label">Pasajero</div><div class="value">${escapeHtml(passengerName)}</div>
          <div class="label">Vuelo</div><div class="value">${escapeHtml(flightNumber)}</div>
          <div class="label">Asiento</div><div class="value">${escapeHtml(seatLabel)}</div>
          <div class="label">Clase</div><div class="value">—</div>
          <div class="label">Número de boleto</div><div class="value">${escapeHtml(ticketNumber)}</div>
          <div class="label">Código de check-in</div><div class="value">${escapeHtml(checkInCode)}</div>
          <div class="total">Total pagado: USD ${price.toFixed(2)}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();
    printWindow.print();
  };

  const finalizeSale = () => {
    if (!ticketResponse) return;
    onCompleted(ticketResponse);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) void close(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Venta en Mostrador · {seatLabel}</DialogTitle>
          <DialogDescription>
            {step < 4
              ? <>Paso {step} de 3 · USD {price.toFixed(2)} · ⏱️ Tiempo restante: {formattedTime}</>
              : "Boleto emitido correctamente"}
          </DialogDescription>
        </DialogHeader>
        {step < 4 && (
          <div className="flex items-center gap-2" aria-label={`Paso ${step} de 3`}>
            {[1, 2, 3].map((progressStep) => (
              <span
                key={progressStep}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  progressStep <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}
        {step === 1 && (
          <div className="space-y-3" onKeyDown={handleStepKeyDown}>
            <h3 className="font-semibold">Cliente</h3>
            {!newCustomer && !selectedCustomer && (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-9 pr-9"
                  placeholder="Buscar por nombre, correo o teléfono"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {isSearching && <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" />}
              </div>
            )}
            {!newCustomer && !selectedCustomer && query.trim().length >= 2 && matches.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-md border bg-card shadow-md">
                {matches.map((item) => (
                  <button key={item.id} type="button" className="block w-full px-3 py-2 text-left hover:bg-muted" onClick={() => chooseCustomer(item)}>
                    <span className="block text-sm">{item.nombre} {item.apellido ?? ""}</span>
                    <span className="block text-xs text-muted-foreground">{item.correo ?? item.telefono ?? "Sin contacto"}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="space-y-1 rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-900">✓ Cliente Titular Seleccionado</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-red-600 hover:bg-red-50 hover:text-red-700" onClick={clearSelectedCustomer}>
                    Cambiar
                  </Button>
                </div>
                <p className="font-medium text-foreground">{selectedCustomer.nombre} {selectedCustomer.apellido ?? ""}</p>
                <p className="text-muted-foreground">{selectedCustomer.correo ?? "Sin correo"} · {selectedCustomer.telefono || "Sin teléfono"}</p>
              </div>
            )}
            {!selectedCustomer && !newCustomer && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCustomer(emptyCustomer);
                  setCustomerError("");
                  setNewCustomer(true);
                }}
              >
                Nuevo Cliente
              </Button>
            )}
            {newCustomer && <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-900">Contraseña provisional: Nex#2026Temp</p>}
            {newCustomer && (
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder="Nombre" value={customer.nombre} onChange={(event) => setCustomer({ ...customer, nombre: event.target.value })} />
                <Input placeholder="Apellido" value={customer.apellido} onChange={(event) => setCustomer({ ...customer, apellido: event.target.value })} />
                <Input type="email" placeholder="Correo" value={customer.correo} onChange={(event) => setCustomer({ ...customer, correo: event.target.value })} />
                <Input
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="Ej: 55551234"
                  value={customer.telefono}
                  onChange={(event) => setCustomer({
                    ...customer,
                    telefono: event.target.value.replace(/\D/g, "").slice(0, 12),
                  })}
                />
                <div className="space-y-2 sm:col-span-2">
                  {customerError && <p role="alert" className="text-xs text-red-600">{customerError}</p>}
                  <Button type="button" onClick={() => void saveNewCustomer()} disabled={savingCustomer}>
                    {savingCustomer ? "Guardando..." : "💾 Guardar y Seleccionar Cliente"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3" onKeyDown={handleStepKeyDown}>
            <h3 className="font-semibold">Pasajero</h3>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={sameCustomer} onCheckedChange={updateSameCustomer} /> El pasajero es el mismo cliente</label>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Nombre" value={passenger.nombre} onChange={(event) => setPassenger({ ...passenger, nombre: event.target.value })} />
              <Input placeholder="Apellido" value={passenger.apellido} onChange={(event) => setPassenger({ ...passenger, apellido: event.target.value })} />
              <select
                value={passenger.tipo_documento}
                onChange={(event) => setPassenger({ ...passenger, tipo_documento: event.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="" disabled>-- Selecciona un documento --</option>
                <option value="DPI">DPI (Documento Personal de Identificación)</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                <option value="CEDULA">Cédula de Identidad / Extranjería</option>
                <option value="LICENCIA">Licencia de Conducir</option>
              </select>
              <Input
                inputMode={passenger.tipo_documento === "DPI" || passenger.tipo_documento === "DNI" ? "numeric" : "text"}
                maxLength={passenger.tipo_documento === "DPI" ? 13 : passenger.tipo_documento === "DNI" ? 10 : 12}
                placeholder="Número de documento"
                value={passenger.numero_documento}
                onChange={(event) => {
                  const value = passenger.tipo_documento === "DPI" || passenger.tipo_documento === "DNI"
                    ? event.target.value.replace(/\D/g, "")
                    : event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                  setPassenger({
                    ...passenger,
                    numero_documento: value.slice(0, passenger.tipo_documento === "DPI" ? 13 : passenger.tipo_documento === "DNI" ? 10 : 12),
                  });
                }}
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Pago</h3>
            <p className="rounded-md bg-muted/50 p-3 text-sm">Total: <strong>USD {price.toFixed(2)}</strong></p>
            <select
              value={paymentMethodId}
              onChange={(event) => setPaymentMethodId(event.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="" disabled>-- Selecciona un método de pago --</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={String(method.id)}>
                  {method.nombre}
                </option>
              ))}
            </select>
            {isCardPayment && (
              <>
                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  ⚠️ SIMULADOR DE PAGO: Modo de pruebas activo. No se realizará ningún cobro monetario real.
                </div>
                <div className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-blue-950 to-amber-700 p-5 text-white shadow-lg">
                  <div className="flex items-start justify-between">
                    <span className="text-xs uppercase tracking-[0.25em] text-amber-200">Tarjeta simulada</span>
                    <span className="text-3xl font-bold italic tracking-tight">VISA</span>
                  </div>
                  <div className="mt-8 grid gap-3">
                    <label className="grid gap-1 text-xs">
                      Número de tarjeta
                      <Input
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="4532 0000"
                        value={cardNumber}
                        onChange={(event) => setCardNumber(event.target.value.replace(/\D/g, "").slice(0, 8))}
                        className="border-white/30 bg-white/10 text-white placeholder:text-white/60"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1 text-xs">
                        Vencimiento
                        <Input
                          inputMode="numeric"
                          maxLength={5}
                          placeholder="12/28"
                          value={cardExpiry}
                          onChange={(event) => {
                            const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                            setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                          }}
                          className="border-white/30 bg-white/10 text-white placeholder:text-white/60"
                        />
                      </label>
                      <label className="grid gap-1 text-xs">
                        CVV
                        <Input
                          inputMode="numeric"
                          maxLength={3}
                          placeholder="123"
                          value={cardCvv}
                          onChange={(event) => setCardCvv(event.target.value.replace(/\D/g, "").slice(0, 3))}
                          className="border-white/30 bg-white/10 text-white placeholder:text-white/60"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {step === 4 && ticketResponse && (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <p className="font-semibold">Boleto confirmado</p>
              <p className="mt-1 text-sm">El pasajero puede presentarse en mostrador para check-in o usar su código de reserva.</p>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="text-lg font-bold">airINex · Pase de Abordar y Comprobante</h3>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div><dt className="text-muted-foreground">Pasajero</dt><dd className="font-medium">{capitalizeName(`${passenger.nombre} ${passenger.apellido}`)}</dd></div>
                <div><dt className="text-muted-foreground">Vuelo</dt><dd className="font-medium">{flightNumber}</dd></div>
                <div><dt className="text-muted-foreground">Asiento</dt><dd className="font-medium">{seatLabel}</dd></div>
                <div><dt className="text-muted-foreground">Clase</dt><dd className="font-medium">{seatClass}</dd></div>
                <div><dt className="text-muted-foreground">Número de boleto</dt><dd className="break-all font-mono text-xs font-semibold tracking-tight text-foreground">{ticketNumber}</dd></div>
                <div><dt className="text-muted-foreground">Código de check-in</dt><dd className="font-mono font-medium">{checkInCode}</dd></div>
                <div className="col-span-2 border-t pt-3"><dt className="text-muted-foreground">Total pagado</dt><dd className="text-lg font-bold">USD {price.toFixed(2)}</dd></div>
              </dl>
            </div>
          </div>
        )}
        <DialogFooter>
          {step === 4 ? (
            <>
              <Button type="button" variant="outline" onClick={printTicket}>🖨️ Imprimir Boleto</Button>
              <Button type="button" onClick={finalizeSale}>Finalizar</Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => void close()} disabled={busy}>Cancelar</Button>
              {step > 1 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={busy}>Atrás</Button>}
              {step < 3 ? <Button type="button" onClick={() => setStep(step + 1)} disabled={!canNext || busy}>Continuar</Button> : <Button type="button" onClick={() => void issueTicket()} disabled={!canPay || busy}>{busy ? "Emitiendo..." : `Pagar USD ${price.toFixed(2)} y Emitir Boleto`}</Button>}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
