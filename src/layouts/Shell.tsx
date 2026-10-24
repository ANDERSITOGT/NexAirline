import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Plane, LayoutDashboard, PlaneTakeoff, Ticket, ChevronDown, ChevronRight, ChevronUp, Bell, Search, LogOut,
  Building2, Armchair, Shuffle, CreditCard, ShieldCheck, ScrollText, MoreHorizontal, Home, Menu,
  Languages, Clock3, Check, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { endSession, getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePreferences } from "@/contexts/usePreferences";
import { GlobalSearchDialog } from "@/components/common/GlobalSearchDialog";
import { isAdministrator } from "@/lib/auth";

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
const getStringProperty = (value: unknown, key: string) => {
  if (!value || typeof value !== "object") return "";
  const property = (value as Record<string, unknown>)[key];
  return typeof property === "string" ? property.trim() : "";
};

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

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const { pathname } = useLocation();
  const activeId = pageFromPath(pathname) === "nuevo" ? "vuelos" : pageFromPath(pathname);
  const visibleNav = nav.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.href !== "/seguridad/roles" || isAdministrator()),
  })).filter((group) => group.items.length > 0);

  return (
    <ScrollArea className="min-h-0 flex-1 px-3 py-4 [&>[data-radix-scroll-area-viewport]]:max-h-full">
      <nav className="space-y-1">
        {visibleNav.map((group) => (
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
                    onClick={onNavigate}
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
const supportedTimeZones = Intl.supportedValuesOf("timeZone");

export default function Shell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [openSearch, setOpenSearch] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { language, timezone, setLanguage, setTimezone } = usePreferences();
  const currentUser = getCurrentUser();
  const getUserString = (key: string) => {
    return getStringProperty(currentUser, key);
  };
  const userFullName = `${getUserString("nombre")} ${getUserString("apellido")}`.trim()
    || getUserString("nombre_usuario")
    || "Usuario";
  const roleValue = currentUser?.rol;
  const userRole = (
    roleValue && typeof roleValue === "object"
      ? getStringProperty(roleValue, "nombre")
      : typeof roleValue === "string"
        ? roleValue.trim()
        : ""
  ) || getUserString("cargo") || "Administrador";
  const userEmail = getUserString("correo") || getUserString("email") || "Sin correo registrado";
  const userInitials = userFullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0].toUpperCase())
    .join("") || "US";
  const selectTimezone = (zone: string) => {
    setTimezone(zone);
    setIsTimezoneOpen(false);
    setTimezoneSearch("");
  };
  const filteredTimeZones = [timezone, ...supportedTimeZones]
    .filter((zone, index, zones) => zones.indexOf(zone) === index)
    .filter((zone) =>
      zone.toLocaleLowerCase().includes(timezoneSearch.toLocaleLowerCase()),
    );
  const page = pageFromPath(pathname);
  const activeId = page === "nuevo" ? "vuelos" : page;
  const crumbs = page === "nuevo"
    ? ["airlNex", groupOf(page), "Vuelos", "Programar vuelo"]
    : ["airlNex", groupOf(page), labelOf(page)];
  const handleLogout = () => {
    endSession();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsMobileMenuOpen(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  return (
    <div className="flex h-screen w-full min-w-0 overflow-x-hidden bg-background">
      <aside
        className={cn(
          "hidden h-full shrink-0 flex-col border-r bg-[#0b132b] text-white md:flex md:w-64",
        )}
      >
        <div className="flex h-14 shrink-0 items-center border-b border-white/10 px-4">
          <Logo />
        </div>
        <Sidebar />
        <div className="mt-auto border-t border-slate-800/80 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex w-full items-center justify-between gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-800/60 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-700/60 bg-slate-800 text-xs font-bold text-orange-400 shadow-sm group-hover:border-orange-500/40">
                    {userInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-slate-100">{userFullName}</div>
                    <div className="truncate text-[11px] capitalize text-slate-400">{userRole}</div>
                  </div>
                </div>
                <ChevronUp className="size-4 shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align="start"
              className="mb-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-100 shadow-xl backdrop-blur-md"
            >
              <div className="border-b border-slate-800/80 px-2 py-2">
                <p className="text-xs font-bold leading-tight text-white">{userFullName}</p>
                <p className="mt-0.5 truncate text-[11px] text-slate-400">{userEmail}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                    <Shield className="size-3" />
                    {userRole}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Activo
                  </span>
                </div>
              </div>

              <div className="py-1">
                <DropdownMenuItem
                  onClick={() => navigate("/operaciones/dashboard")}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800/70 hover:text-white"
                >
                  <LayoutDashboard className="size-3.5 text-slate-400" />
                  <span>Mi estación de trabajo</span>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="my-1 bg-slate-800/80" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="size-3.5" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex h-full min-w-0 w-full flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(true)}
              className="mr-2 md:hidden"
              aria-label="Abrir menú"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Languages className="size-4" />
                  {language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Idioma</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={language}
                  onValueChange={(value) => setLanguage(value as "es" | "en")}
                >
                  <DropdownMenuRadioItem value="es">ES</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="en">EN</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover
              open={isTimezoneOpen}
              onOpenChange={setIsTimezoneOpen}
              modal={false}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="max-w-52 gap-1.5">
                  <Clock3 className="size-4 shrink-0" />
                  <span className="truncate">{timezone}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar zona horaria..."
                    value={timezoneSearch}
                    onValueChange={setTimezoneSearch}
                  />
                  <CommandList>
                    {filteredTimeZones.length === 0 ? (
                      <CommandEmpty>No se encontró la zona horaria.</CommandEmpty>
                    ) : (
                      <CommandGroup heading="Zonas horarias">
                        <div role="listbox" className="max-h-60 overflow-y-auto p-1">
                          {filteredTimeZones.map((zone) => (
                            <button
                              key={zone}
                              type="button"
                              role="option"
                              aria-selected={timezone === zone}
                              className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              onClick={() => selectTimezone(zone)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4 shrink-0",
                                  timezone === zone ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {zone}
                            </button>
                          ))}
                        </div>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <button
              type="button"
              onClick={() => setOpenSearch(true)}
              className="hidden h-9 w-64 items-center justify-between rounded-lg border border-input bg-background/60 px-3 text-xs text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:flex"
              aria-label="Abrir búsqueda global"
            >
              <span className="flex items-center gap-2">
                <Search className="size-3.5" />
                Buscar módulo, vuelo, reserva...
              </span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
            <button aria-label="Notificaciones" className="relative rounded-md p-2 hover:bg-muted">
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent ring-2 ring-card" />
            </button>
          </div>
        </header>
        <GlobalSearchDialog open={openSearch} onOpenChange={setOpenSearch} />

        <main className="w-full min-w-0 flex-1 overflow-y-auto px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-6">
          <div className="mx-auto w-full max-w-[1280px] min-w-0"><Outlet /></div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-card md:hidden">
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
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
                aria-label="Abrir menú"
              >
                <MoreHorizontal className="size-5" />
                Más
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 max-w-[85%] flex-col bg-primary p-0 text-white sm:max-w-sm">
              <div className="flex h-16 items-center border-b border-white/10 px-5">
                <Logo />
              </div>
              <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </div>
  );
}
