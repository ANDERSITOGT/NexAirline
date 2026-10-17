import { LayoutDashboard, PlaneTakeoff, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OperationsHubPage() {
  return (
    <div>
      <AppBreadcrumb items={[{ label: "Operaciones" }]} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Centro de Control de Operaciones
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Supervisión en tiempo real de salidas, programación de vuelos diarios y gestión de reasignaciones.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <LayoutDashboard className="mb-2 size-8 text-accent" />
            <CardTitle>Dashboard Operativo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              Monitoreo de métricas clave, pasajeros diarios y aeronaves en mantenimiento
            </p>
            <Button asChild>
              <Link to="/operaciones/dashboard">Ver dashboard</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <PlaneTakeoff className="mb-2 size-8 text-accent" />
            <CardTitle>Programación de Vuelos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              Control de itinerarios, asignación de puertas de embarque y estados de salida
            </p>
            <Button asChild>
              <Link to="/operaciones/vuelos">Gestionar vuelos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <RefreshCw className="mb-2 size-8 text-accent" />
            <CardTitle>Reasignaciones y Contingencias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              Manejo de cancelaciones, reubicación de asientos y resolución de incidencias
            </p>
            <Button asChild>
              <Link to="/operaciones/reasignaciones">Gestionar reasignaciones</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}