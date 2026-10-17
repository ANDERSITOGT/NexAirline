import { Building2, Route } from "lucide-react";
import { Link } from "react-router-dom";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InfrastructureHubPage() {
  return (
    <div>
      <AppBreadcrumb items={[{ label: "Infraestructura" }]} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Infraestructura y Red Logística
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Gestión centralizada de aeropuertos, terminales, puertas de embarque y trazado de rutas comerciales.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <Building2 className="mb-2 size-8 text-accent" />
            <CardTitle>Catálogos Base</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              Administración de pistas, terminales, puertas y códigos IATA/ICAO
            </p>
            <Button asChild>
              <Link to="/infraestructura/catalogos">Gestionar infraestructura →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <Route className="mb-2 size-8 text-accent" />
            <CardTitle className="flex items-center gap-2">
              Conectividad Aérea
              <Badge variant="secondary">En desarrollo</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mapa de conexiones y asignación logística entre orígenes y destinos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}