import { Armchair, Plane } from "lucide-react";
import { Link } from "react-router-dom";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FleetHubPage() {
  return (
    <div>
      <AppBreadcrumb items={[{ label: "Flota" }]} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Gestión de Flota y Aeronaves
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Control de inventario de aeronaves, aerolíneas operadoras y diseño de configuraciones de cabina.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <Plane className="mb-2 size-8 text-accent" />
            <CardTitle>Aeronaves y Aerolíneas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              Registro de matrículas, modelos y asignación de flotas activas
            </p>
            <Button asChild>
              <Link to="/flota/aviones">Gestionar aeronaves</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <Armchair className="mb-2 size-8 text-accent" />
            <CardTitle>Configuración de Cabinas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              Diseño estructural de filas, columnas y tipología física de asientos
            </p>
            <Button asChild>
              <Link to="/flota/mapa-asientos">Gestionar cabinas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}