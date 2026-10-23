import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generarNumeroVuelo = (prefijo = "AX"): string => {
  const randomNum = Math.floor(1000 + Math.random() * 8999);
  return `${prefijo}-${randomNum}`;
};