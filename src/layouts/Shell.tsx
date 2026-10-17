import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Plane, LayoutDashboard, PlaneTakeoff, Ticket, ChevronDown, ChevronRight, Bell, Search,
  Building2, Armchair, Shuffle, CreditCard, ShieldCheck, ScrollText, MoreHorizontal, Home, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type Page = "dashboard" | "vuelos" | "nuevo" | string;

type Icon = typeof Plane;
interface NavItem { id: Page; label: string; icon: Icon; href?: string }
interface NavGroup { name: string; items: NavItem[] }

const nav: NavGroup[] = [
  { name: "Operaciones", items: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/operaciones/dashboard" },
    { id: "vuelos", label: "Vuelos", icon: PlaneTakeoff, href: "/operaciones/vuelos" },
    { id: "reasignaciones", label: "Reasignaciones", icon: Shuffle, href: "/operaciones/reasignaciones" },
  ] },
  { name: "Flota", items: [
    { id: "flota", label: "Aviones y aerolíneas", icon: Plane, href: "/flota/aviones" },
    { id: "asientos", label: "Mapa de asientos", icon: Armchair, href: "/flota/mapa-asientos" },
  ] },
  { name: "Infraestructura", items: [
    { id: "infraestructura", label: "Catálogos base", icon: Building2, href: "/infraestructura/catalogos" },
  ] },
  { name: "Ventas", items: [
    { id: "reservas", label: "Reservas", icon: Ticket, href: "/ventas/reservas" },
    { id: "pagos", label: "Pagos", icon: CreditCard, href: "/ventas/pagos" },
  ] },
  { name: "Seguridad", items: [
    { id: "seguridad", label: "Roles y errores", icon: ShieldCheck, href: "/seguridad/roles" },
    { id: "bitacora", label: "Bitácora de asientos", icon: ScrollText, href: "/seguridad/bitacora" }
   ] },
];

const allItems = nav.flatMap((group) => group.items);
const pageFromPath = (pathname: string): Page => {
  if (pathname === "/vuelos/nuevo") return "nuevo";
  return pathname.split("/")[1] || "dashboard";
};
const labelOf = (page: Page) =>
  page === "nuevo" ? "Programar vuelo" : allItems.find((item) => item.id === page)?.label ?? page;
const groupOf = (page: Page) =>
  nav.find((group) => group.items.some((item) => item.id === page || (page === "nuevo" && item.id === "vuelos")))?.name ?? "Operaciones";

function Logo() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-md bg-accent text-white">
        <Plane className="size-4 -rotate-45" />
      </div>
      <span className="text-[17px] font-bold tracking-tight">
        airl<span className="text-accent">Nex</span>
      </span>
    </Link>
  );
}

function Sidebar() {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const { pathname } = useLocation();
  const activeId = pageFromPath(pathname) === "nuevo" ? "vuelos" : pageFromPath(pathname);

  return (
    <ScrollArea className="min-h-0 flex-1 px-3 py-4 [&>[data-radix-scroll-area-viewport]]:max-h-full">
      <nav className="space-y-1">
        {nav.map((group) => (
          <div key={group.name} className="mb-2">
            <button
              onClick={() => setClosed({ ...closed, [group.name]: !closed[group.name] })}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/50 hover:text-white/80"
            >
              {group.name}
              <ChevronDown className={`size-3.5 transition-transform ${closed[group.name] ? "-rotate-90" : ""}`} />
            </button>
            {!closed[group.name] &&
              group.items.map((item) => {
                const on = item.href ? pathname === item.href : activeId === item.id;
                return (
                  <NavLink
                    key={item.id}
                    to={item.href ?? `/${item.id}`}
                    className={`relative mt-0.5 flex w-full items-center gap-3 rounded-md px-2.5 py-1.5 text-sm transition-colors ${on ? "bg-white/10 font-medium text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                  >
                    {on && <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r bg-accent" />}
                    <item.icon className="size-[18px]" />
                    {item.label}
                  </NavLink>
                );
              })}
          </div>
        ))}
      </nav>
      </ScrollArea>
  );
}

const bottom: { id: Page; label: string; icon: Icon }[] = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "vuelos", label: "Vuelos", icon: PlaneTakeoff },
  { id: "reservas", label: "Reservas", icon: Ticket },
  { id: "flota", label: "Flota", icon: Plane },
];

export default function Shell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { pathname } = useLocation();
  const page = pageFromPath(pathname);
  const activeId = page === "nuevo" ? "vuelos" : page;
  const crumbs = page === "nuevo"
    ? ["airlNex", groupOf(page), "Vuelos", "Programar vuelo"]
    : ["airlNex", groupOf(page), labelOf(page)];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside
        className={cn(
          "flex h-full shrink-0 flex-col border-r bg-[#0b132b] text-white transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-0 -translate-x-full overflow-hidden",
        )}
      >
        <div className="flex h-14 shrink-0 items-center border-b border-white/10 px-4">
          <Logo />
        </div>
        <Sidebar />
        <div className="flex shrink-0 items-center gap-3 border-t border-white/10 p-4">
          <div className="flex size-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">MR</div>
          <div className="min-w-0 text-sm leading-tight">
            <div className="truncate font-medium">Marta Ramírez</div>
            <div className="text-xs text-white/50">Jefa de operaciones</div>
          </div>
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-4"
              aria-label="Alternar menú lateral"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="lg:hidden"><Logo /></div>
          </div>
          {!pathname.startsWith("/infraestructura") && !pathname.startsWith("/flota") && !pathname.startsWith("/ventas") && !pathname.startsWith("/operaciones") && !pathname.startsWith("/seguridad") && (
            <ol className="hidden items-center gap-1.5 text-sm text-muted-foreground lg:flex">
              {crumbs.map((crumb, index) => (
                <li key={`${crumb}-${index}`} className="flex items-center gap-1.5">
                  {index > 0 && <ChevronRight className="size-3.5" />}
                  <span className={index === crumbs.length - 1 ? "font-medium text-foreground" : ""}>{crumb}</span>
                </li>
              ))}
            </ol>
          )}
          <div className="flex items-center gap-2">
            <div className="hidden h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground md:flex">
              <Search className="size-4" />
              <span className="w-40">Buscar vuelo, matrícula…</span>
              <kbd className="rounded border border-border bg-card px-1.5 font-mono text-[10px]">⌘K</kbd>
            </div>
            <button aria-label="Notificaciones" className="relative rounded-md p-2 hover:bg-muted">
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent ring-2 ring-card" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6">
          <div className="mx-auto w-full max-w-[1280px]"><Outlet /></div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card lg:hidden">
          {bottom.map((item) => {
            const on = activeId === item.id;
            return (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${on ? "text-primary" : "text-muted-foreground"}`}
              >
                <item.icon className={`size-5 ${on ? "text-accent" : ""}`} />
                {item.label}
              </NavLink>
            );
          })}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground">
                <MoreHorizontal className="size-5" />
                Más
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 max-w-[85%] flex-col bg-primary p-0 text-white sm:max-w-sm">
              <div className="flex h-16 items-center border-b border-white/10 px-5">
                <Logo />
              </div>
              <Sidebar />
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </div>
  );
}
