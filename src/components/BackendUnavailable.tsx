import { Plane, RefreshCw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackendUnavailableProps {
  isChecking: boolean;
  onRetry: () => void;
}

export function BackendUnavailable({ isChecking, onRetry }: BackendUnavailableProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
        <div className="relative mx-auto mb-7 flex size-20 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Plane className="size-9 -rotate-12" />
          <span className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground">
            <Wrench className="size-3.5" />
          </span>
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          AstraCode Air
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Estamos realizando mantenimiento
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          El sistema estará disponible nuevamente en unos momentos. Estamos trabajando para
          restablecer todos los servicios.
        </p>
        <Button className="mt-8" onClick={onRetry} disabled={isChecking}>
          <RefreshCw className={isChecking ? "size-4 animate-spin" : "size-4"} />
          {isChecking ? "Comprobando conexión" : "Intentar de nuevo"}
        </Button>
      </section>
    </main>
  );
}