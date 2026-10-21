import { api } from "./api";

export interface MetodoPago {
  id: number;
  nombre: string;
  activo: boolean;
}

export const getPaymentMethods = async (): Promise<MetodoPago[]> => {
  return api.get<MetodoPago[]>("/metodo-pago");
};

export const togglePaymentMethod = async (id: number): Promise<MetodoPago> => {
  return api.patch<MetodoPago>(`/metodo-pago/${id}/toggle`);
};
