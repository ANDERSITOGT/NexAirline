import { api } from "./api";

export type PaymentStatus = "APROBADO" | "PENDIENTE" | "RECHAZADO";

export interface PagoItem {
  id: number;
  reserva_id: number;
  codigo_reserva?: string;
  cliente_nombre: string;
  metodo_pago: string;
  monto: number;
  estado: PaymentStatus;
  referencia?: string;
  fecha_pago?: string;
  registrado_por: string;
}

export interface ResumenFinanciero {
  aprobado_monto: number;
  aprobado_conteo: number;
  pendiente_monto: number;
  pendiente_conteo: number;
  rechazado_monto: number;
  rechazado_conteo: number;
}

export interface PagosPaginadosResponse {
  data: PagoItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  resumen: ResumenFinanciero;
}

export interface GetPaymentsParams {
  page?: number;
  limit?: number;
  q?: string;
  estado?: string;
  periodo?: string;
}

export async function getPayments({
  page,
  limit,
  q,
  estado,
  periodo,
}: GetPaymentsParams = {}): Promise<PagosPaginadosResponse> {
  const searchParams = new URLSearchParams();
  if (page != null) searchParams.set("page", String(page));
  if (limit != null) searchParams.set("limit", String(limit));
  if (q?.trim()) searchParams.set("q", q.trim());
  if (estado && estado !== "TODOS") searchParams.set("estado", estado);
  if (periodo && periodo !== "todos") searchParams.set("periodo", periodo);

  const queryString = searchParams.toString();
  return api.get<PagosPaginadosResponse>(`/pago${queryString ? `?${queryString}` : ""}`);
}

export const updatePaymentStatus = async (
  id: number,
  estado: "APROBADO" | "RECHAZADO",
): Promise<void> => {
  await api.patch(`/pago/${id}/estado`, { estado });
};
