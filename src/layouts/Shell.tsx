import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Plane, LayoutDashboard, PlaneTakeoff, Ticket, ChevronDown, ChevronUp, Bell, BellOff, Search, LogOut,
  Building2, Armchair, Shuffle, CreditCard, ShieldCheck, ScrollText, MoreHorizontal, Home, Menu,
  Languages, Clock3, Check, Shield,
} from "lucide-react";
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

const pageFromPath = (pathname: string): Page => {
  if (pathname === "/vuelos/nuevo") return "nuevo";
  return pathname.split("/")[1] || "dashboard";
};
const getStringProperty = (value: unknown, key: string) => {
  if (!value || typeof value !== "object") return "";
  const property = (value as Record<string, unknown>)[key];
  return typeof property === "string" ? property.trim() : "";
};

function Logo() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-2xl bg-accent text-white">
        <Plane className="size-4 -rotate-45" />
      </div>
      <span className="text-[16px] font-extrabold tracking-tight">AstraCode Air</span>
    </Link>
  );
}

function Sidebar({
  onNavigate,
  isCollapsed = false,
}: {
  onNavigate?: () => void;
  isCollapsed?: boolean;
}) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const { pathname } = useLocation();
  const activeId = pageFromPath(pathname) === "nuevo" ? "vuelos" : pageFromPath(pathname);
  const visibleNav = nav.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.href !== "/seguridad/roles" || isAdministrator()),
  })).filter((group) => group.items.length > 0);

  return (
    <ScrollArea className={cn(
      "min-h-0 flex-1 py-4 [&>[data-radix-scroll-area-viewport]]:max-h-full",
      isCollapsed ? "px-2" : "px-3",
    )}>
      <nav className="space-y-1">
        {visibleNav.map((group) => (
          <div key={group.name} className="mb-2">
            {!isCollapsed && (
              <button
                onClick={() => setClosed({ ...closed, [group.name]: !closed[group.name] })}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-100/80 hover:text-white"
              >
                {group.name}
                <ChevronDown className={`size-3.5 transition-transform ${closed[group.name] ? "-rotate-90" : ""}`} />
              </button>
            )}
            {(!closed[group.name] || isCollapsed) &&
              group.items.map((item) => {
                const on = item.href ? pathname === item.href : activeId === item.id;
                return (
                  <NavLink
                    key={item.id}
                    to={item.href ?? `/${item.id}`}
                    onClick={onNavigate}
                    title={isCollapsed ? item.label : undefined}
                    className={`relative mt-0.5 flex w-full items-center rounded-md py-1.5 text-sm transition-colors ${isCollapsed ? "justify-center px-2" : "gap-3 px-2.5"} ${on ? "bg-slate-800/50 font-medium text-white" : "text-slate-300 hover:bg-slate-800/50 hover:text-white"}`}
                  >
                    {on && <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r bg-accent" />}
                    <item.icon className="size-[18px]" />
                    <span className={cn("overflow-hidden whitespace-nowrap", isCollapsed && "hidden")}>{item.label}</span>
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-900 text-slate-200">
      <header className="flex h-14 w-full flex-none items-center justify-between bg-slate-900 px-4">
        <div className="flex w-1/4 min-w-fit items-center gap-3">
          <div className="shrink-0 [&_*]:text-white"><Logo /></div>
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
            aria-label={isSidebarCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
            aria-expanded={!isSidebarCollapsed}
            className="hidden rounded-md p-2 text-slate-100 transition-colors hover:bg-white/10 hover:text-white md:inline-flex"
          >
            <Menu className="h-5 w-5 text-slate-100 transition-colors hover:text-white" />
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú"
            className="rounded-md p-2 text-slate-100 transition-colors hover:bg-white/10 hover:text-white md:hidden"
          >
            <Menu className="h-5 w-5 text-slate-100 transition-colors hover:text-white" />
          </button>
        </div>
        <div className="relative mx-auto hidden w-full max-w-lg flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            readOnly
            placeholder="Buscar módulo, vuelo, reserva..."
            onClick={() => setOpenSearch(true)}
            onFocus={() => setOpenSearch(true)}
            aria-label="Abrir búsqueda global"
            className="w-full cursor-pointer rounded-full border border-slate-700/50 bg-slate-800/50 py-1.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 transition-all focus:bg-slate-800 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          />
        </div>
        <div className="flex w-1/4 items-center justify-end gap-4 sm:gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-100 transition-colors hover:text-white">
                <Languages className="size-4" />
                {language.toUpperCase()}
              </button>
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
              <button type="button" className="flex max-w-52 cursor-pointer items-center gap-2 truncate text-sm font-medium text-slate-100 transition-colors hover:text-white">
                <Clock3 className="size-4 shrink-0" />
                <span className="truncate">{timezone}</span>
              </button>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Notificaciones" className="relative cursor-pointer rounded-md p-2 text-slate-100 transition-colors hover:bg-white/10 hover:text-white">
                <Bell className="h-5 w-5 text-slate-100 transition-colors hover:text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-lg">
              <BellOff className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-900">No hay notificaciones</p>
              <p className="mt-1 text-xs text-slate-500">Estás al día con todas las alertas.</p>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden pr-2 pb-2">
      <aside
        className={cn(
          "hidden flex-none flex-col pt-2 text-slate-200 transition-all duration-300 ease-in-out md:flex",
          isSidebarCollapsed ? "w-16 items-center" : "w-64 px-3",
        )}
      >
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <div className={cn(
          "mt-auto w-full border-t border-white/10",
          isSidebarCollapsed ? "p-2" : "p-3",
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={isSidebarCollapsed ? `Perfil de ${userFullName}` : undefined}
                className={cn(
                  "group flex w-full items-center rounded-xl p-2 text-left transition-colors hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-orange-500/50",
                  isSidebarCollapsed ? "justify-center" : "justify-between gap-3",
                )}
              >
                <div className={cn("flex min-w-0 items-center", isSidebarCollapsed ? "justify-center" : "gap-3")}>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-700/60 bg-slate-800 text-xs font-bold text-orange-400 shadow-sm group-hover:border-orange-500/40">
                    {userInitials}
                  </div>
                  {!isSidebarCollapsed && <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                    <div className="truncate text-xs font-semibold text-slate-100">{userFullName}</div>
                    <div className="truncate text-[11px] capitalize text-slate-400">{userRole}</div>
                  </div>}
                </div>
                {!isSidebarCollapsed && <ChevronUp className="size-4 shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />}
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

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-tl-3xl border border-slate-700/30 bg-slate-50 text-slate-900 shadow-2xl mr-2 mb-2">
          <div className="min-h-0 flex-1 overflow-y-auto p-6 pb-20 md:p-8 md:pb-8">
            <div className="mx-auto w-full max-w-[1280px] min-w-0"><Outlet /></div>
          </div>
        </main>
      </div>

      <GlobalSearchDialog open={openSearch} onOpenChange={setOpenSearch} />
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
  );
}
