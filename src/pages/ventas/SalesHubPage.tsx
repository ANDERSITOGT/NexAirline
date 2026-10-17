import { CreditCard, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SalesHubPage() {
  return (
    <div>
      <AppBreadcrumb items={[{ label: "Ventas" }]} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Gestión Comercial y Ventas
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Supervisión de reservas, emisión de boletos, seguimiento de clientes y auditoría de transacciones financieras.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <Ticket className="mb-2 size-8 text-accent" />
            <CardTitle>Reservas y Boletos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              Control de reservaciones activas, pasajeros y estados de emisión
            </p>
            <Button asChild>
              <Link to="/ventas/reservas">Gestionar reservas</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CreditCard className="mb-2 size-8 text-accent" />
            <CardTitle>Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              Registro de cobros, métodos de pago utilizados y validación contable
            </p>
            <Button asChild>
              <Link to="/ventas/pagos">Gestionar pagos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}