import { History, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityHubPage() {
  return (
    <div>
      <AppBreadcrumb items={[{ label: "Seguridad" }]} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Seguridad, Accesos y Auditoría
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Control de perfiles de usuario, matriz de permisos de sistema y registro inmutable de auditoría para trazabilidad de asientos.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <ShieldAlert className="mb-2 size-8 text-accent" />
            <CardTitle>Roles y Errores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              Administración de roles, permisos de operadores y catálogo de errores registrados
            </p>
            <Button asChild>
              <Link to="/seguridad/roles">Gestionar roles y errores</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <History className="mb-2 size-8 text-accent" />
            <CardTitle>Bitácora de Asientos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              Historial de modificaciones, reasignaciones y bloqueos manuales sobre cabinas
            </p>
            <Button asChild>
              <Link to="/seguridad/bitacora">Consultar bitácora</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}