import { api } from "./api";

export type VueloSeatStatus = "DISPONIBLE" | "BLOQUEADO" | "CONFIRMADO";

export interface VueloAsiento {
  id?: number;
  vueloId: number;
  asientoId: number;
  precio: number | null;
  estado: VueloSeatStatus;
}

export interface UpdateBulkPriceDTO {
  vueloId: number;
  asientoIds: number[];
  precio: number;
}

export async function getVueloAsientos(vueloId: number): Promise<VueloAsiento[]> {
  const seats = await api.get<VueloAsiento[]>(`/vuelo-asiento?vueloId=${vueloId}`);
  return seats ?? [];
}

export function updateBulkPrice(
  vueloId: number,
  asientoIds: number[],
  precio: number,
): Promise<void> {
  return api.put<void>("/vuelo-asiento/bulk-price", {
    vueloId,
    asientoIds,
    precio,
  } satisfies UpdateBulkPriceDTO);
}

export function initVueloAsientos(vueloId: number): Promise<void> {
  return api.post<void>("/vuelo-asiento/init", { vueloId });
}