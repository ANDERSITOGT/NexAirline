import { useEffect, useState, type ReactNode } from "react";
import { Country, City } from "country-state-city";
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import {
  flexRender,
} from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type LegacyColumnDef,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import type { PaginationState, SortingState } from "@tanstack/table-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtDuration } from "@/data1";
import { type Gate } from "@/services/gateService";
import {
  createAirport,
  getAirports,
  updateAirport,
  type Airport,
} from "@/services/airportService";
import {
  createTerminal,
  getTerminals,
  updateTerminal,
  type Terminal,
} from "@/services/terminalService";
import { createGate, getGates, updateGate } from "@/services/gateService";
import {
  createRoute,
  getRoutes,
  updateRoute,
  type Route,
} from "@/services/routeService";

type Tab = "aeropuertos" | "terminales" | "rutas" | "puertas";
const tabs: { id: Tab; label: string; singular: string }[] = [
  { id: "aeropuertos", label: "Aeropuertos", singular: "aeropuerto" },
  { id: "terminales", label: "Terminales", singular: "terminal" },
  { id: "rutas", label: "Rutas", singular: "ruta" },
  { id: "puertas", label: "Puertas de embarque", singular: "puerta" },
];
const cellClass = "px-4 py-3";
const fieldClass = "grid gap-1.5 text-sm font-medium";
type AirportForm = {
  id: number;
  nombre: string;
  iata: string;
  icao: string;
  ciudad: string;
  pais: string;
  direccion: string;
  activo: boolean;
};
const blankAirport: AirportForm = {
  id: 0,
  nombre: "",
  iata: "",
  icao: "",
  ciudad: "",
  pais: "",
  direccion: "",
  activo: true,
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={fieldClass}>
      <span>{label}</span>
      {children}
      {hint && (
        <span className="text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      )}
    </div>
  );
}

type SearchableOption = {
  value: string;
  label: string;
  description?: string;
  searchText?: string;
};

function SearchableSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  disabled = false,
  onChange,
}: {
  value: string;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedOption = options.find((option) => option.value === value);
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredOptions = options.filter((option) =>
    (option.searchText ?? option.label)
      .toLocaleLowerCase()
      .includes(normalizedSearch),
  );

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
      modal={false}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              placeholder={searchPlaceholder}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") close();
                if (event.key === "Enter" && filteredOptions[0]) {
                  onChange(filteredOptions[0].value);
                  close();
                }
              }}
              className="h-11 border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No se encontraron resultados.
              </p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className="flex w-full cursor-pointer items-center rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  onClick={() => {
                    onChange(option.value);
                    close();
                  }}
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{option.label}</span>
                    {option.description && (
                      <span className="block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Status({
  active,
  onChange,
  label,
}: {
  active: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Switch checked={active} onCheckedChange={onChange} aria-label={label} />
      <Badge variant={active ? "default" : "secondary"}>
        {active ? "Activo" : "Inactivo"}
      </Badge>
    </div>
  );
}

export default function Infrastructure() {
  const [tab, setTab] = useState<Tab>("aeropuertos");
  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoadingAirports, setIsLoadingAirports] = useState(true);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [isLoadingTerminals, setIsLoadingTerminals] = useState(true);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);
  const [gates, setGates] = useState<Gate[]>([]);
  const [isLoadingGates, setIsLoadingGates] = useState(true);
  const [panel, setPanel] = useState<Tab | null>(null);
  const [airport, setAirport] = useState<AirportForm>(blankAirport);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilterTerminal, setGlobalFilterTerminal] = useState("");
  const [sortingTerminal, setSortingTerminal] = useState<SortingState>([]);
  const [paginationTerminal, setPaginationTerminal] =
    useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
  const [openGateTerminal, setOpenGateTerminal] = useState(false);
  const [gateTerminalSearch, setGateTerminalSearch] = useState("");
  const [globalFilterGate, setGlobalFilterGate] = useState("");
  const [sortingGate, setSortingGate] = useState<SortingState>([]);
  const [paginationGate, setPaginationGate] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilterRoute, setGlobalFilterRoute] = useState("");
  const [sortingRoute, setSortingRoute] = useState<SortingState>([]);
  const [paginationRoute, setPaginationRoute] =
    useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
  const [terminal, setTerminal] = useState<Partial<Terminal>>({ activo: true });
  const [route, setRoute] = useState<Partial<Route>>({ activa: true });
  const [gate, setGate] = useState<Partial<Gate>>({ activo: true });
  const [notice, setNotice] = useState("");
  const countries = Country.getAllCountries();
  const selectedCountryIso = countries.find(
    (country) => country.name === airport.pais
  )?.isoCode;
  const availableCities = selectedCountryIso
    ? City.getCitiesOfCountry(selectedCountryIso) ?? []
    : [];
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [loadedAirports, loadedTerminals, loadedGates, loadedRoutes] =
          await Promise.all([
            getAirports(),
            getTerminals(),
            getGates(),
            getRoutes(),
          ]);
        setAirports(loadedAirports);
        setTerminals(loadedTerminals);
        setGates(loadedGates);
        setRoutes(loadedRoutes);
      } catch {
        setNotice("No se pudieron cargar los catálogos de infraestructura");
      } finally {
        setIsLoadingAirports(false);
        setIsLoadingTerminals(false);
        setIsLoadingGates(false);
        setIsLoadingRoutes(false);
      }
    };
    void loadCatalogs();
  }, []);
  const current = tabs.find((item) => item.id === tab)!;
  const airportById = (id: number) => airports.find((item) => item.id === id);
  const terminalById = (id: number) => terminals.find((item) => item.id === id);
  const routeInvalid =
    !route.aeropuertoOrigenId ||
    !route.aeropuertoDestinoId ||
    route.aeropuertoOrigenId === route.aeropuertoDestinoId ||
    !route.duracionEstimada ||
    !route.distancia;
  const canSave =
    panel === "aeropuertos"
      ? !!airport.nombre &&
        airport.iata.length === 3 &&
        airport.icao.length === 4 &&
        !!airport.pais &&
        !!airport.ciudad &&
        !!airport.direccion
      : panel === "terminales"
        ? !!terminal.aeropuertoId && !!terminal.nombre
        : panel === "rutas"
          ? !routeInvalid
          : !!gate.sedeId && !!gate.numero;

  const openNew = () => {
    if (tab === "aeropuertos") setAirport({ ...blankAirport, id: 0 });
    if (tab === "terminales") setTerminal({ activo: true });
    if (tab === "rutas") setRoute({ activa: true });
    if (tab === "puertas") setGate({ activo: true });
    setPanel(tab);
  };
  const close = () => setPanel(null);
  const save = async () => {
    if (panel === "aeropuertos") {
      if (airport.id) {
        try {
          const updated = await updateAirport(airport.id, {
            nombre: airport.nombre,
            codigoIata: airport.iata,
            codigoIcao: airport.icao,
            ciudad: airport.ciudad,
            pais: airport.pais,
            direccion: airport.direccion,
            activo: airport.activo,
          });
          setAirports((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
        } catch {
          setNotice("No se pudo actualizar el aeropuerto");
          return;
        }
      } else {
        try {
          const created = await createAirport({
            nombre: airport.nombre,
            codigoIata: airport.iata,
            codigoIcao: airport.icao,
            ciudad: airport.ciudad,
            pais: airport.pais,
            direccion: airport.direccion,
          });
          setAirports((items) => [...items, created]);
        } catch {
          setNotice("No se pudo crear el aeropuerto");
          return;
        }
      }
    }
    if (panel === "terminales") {
      try {
        const payload = {
          aeropuertoId: terminal.aeropuertoId!,
          nombre: terminal.nombre!,
          descripcion: terminal.descripcion,
        };
        if (terminal.id && terminal.id > 0) {
          const updated = await updateTerminal(terminal.id, {
            ...payload,
            activo: !!terminal.activo,
          });
          setTerminals((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
        } else {
          const created = await createTerminal(payload);
          setTerminals((items) => [...items, created]);
        }
      } catch {
        setNotice("No se pudo guardar la terminal");
        return;
      }
    }
    if (panel === "rutas") {
      try {
        const payload = {
          aeropuertoOrigenId: route.aeropuertoOrigenId!,
          aeropuertoDestinoId: route.aeropuertoDestinoId!,
          duracionEstimada: route.duracionEstimada!,
          distancia: route.distancia,
        };
        const result =
          route.id && route.id > 0
            ? await updateRoute(route.id, {
                ...payload,
                activa: !!route.activa,
              })
            : await createRoute(payload);
        setRoutes((items) =>
          route.id && route.id > 0
            ? items.map((item) => (item.id === result.id ? result : item))
            : [...items, result],
        );
      } catch {
        setNotice("No se pudo guardar la ruta");
        return;
      }
    }
    if (panel === "puertas") {
      try {
        const payload = {
          sedeId: gate.sedeId!,
          numero: gate.numero!,
          descripcion: gate.descripcion,
        };
        if (gate.id && gate.id > 0) {
          const updated = await updateGate(gate.id, {
            ...payload,
            activo: !!gate.activo,
          });
          setGates((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
        } else {
          const created = await createGate(payload);
          setGates((items) => [...items, created]);
        }
      } catch {
        setNotice("No se pudo guardar la puerta de embarque");
        return;
      }
    }
    setTab(panel!);
    close();
  };

  const airportColumns: LegacyColumnDef<Airport>[] = [
    {
      accessorKey: "codigoIata",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8 px-3 text-xs font-semibold uppercase tracking-wide"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          IATA
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <Badge>{row.original.codigoIata}</Badge>,
    },
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nombre}</span>
      ),
    },
    {
      id: "ubicacion",
      accessorFn: (row) => `${row.ciudad}, ${row.pais}`,
      header: "Ubicación",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.ciudad}, {row.original.pais}
        </span>
      ),
    },
    {
      accessorKey: "codigoIcao",
      header: "ICAO",
      cell: ({ row }) => (
        <span className="font-mono">{row.original.codigoIcao}</span>
      ),
    },
    {
      accessorKey: "activo",
      header: "Activo",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Status
            active={!!item.activo}
            onChange={async (active) => {
              const previousActive = !!item.activo;
              setAirports((items) =>
                items.map((currentItem) =>
                  currentItem.id === item.id
                    ? { ...currentItem, activo: active }
                    : currentItem,
                ),
              );
              try {
                const updated = await updateAirport(item.id, {
                  nombre: item.nombre,
                  codigoIata: item.codigoIata,
                  codigoIcao: item.codigoIcao,
                  ciudad: item.ciudad,
                  pais: item.pais,
                  direccion: item.direccion ?? "",
                  activo: active,
                });
                setAirports((items) =>
                  items.map((currentItem) =>
                    currentItem.id === updated.id
                      ? {
                          ...currentItem,
                          ...updated,
                          activo: updated.activo ?? active,
                        }
                      : currentItem,
                  ),
                );
              } catch {
                setAirports((items) =>
                  items.map((currentItem) =>
                    currentItem.id === item.id
                      ? { ...currentItem, activo: previousActive }
                      : currentItem,
                  ),
                );
                setNotice("No se pudo actualizar el estado del aeropuerto");
              }
            }}
            label={`Activo ${item.codigoIata}`}
          />
        );
      },
    },
    {
      id: "acciones",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-right">
            <Button
              variant="outline"
              size="icon"
              aria-label={`Editar ${item.codigoIata}`}
              onClick={() => {
                setAirport({
                  id: item.id,
                  nombre: item.nombre,
                  iata: item.codigoIata,
                  icao: item.codigoIcao,
                  ciudad: item.ciudad,
                  pais: item.pais,
                  direccion: item.direccion ?? "",
                  activo: item.activo ?? true,
                });
                setPanel("aeropuertos");
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  const airportTable = useLegacyTable({
    data: airports,
    columns: airportColumns,
    state: { globalFilter, sorting, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const terminalColumns: LegacyColumnDef<Terminal>[] = [
    {
      id: "aeropuerto",
      accessorFn: (item) => {
        const airport = airportById(item.aeropuertoId);
        return `${airport?.codigoIata ?? ""} ${airport?.nombre ?? ""} ${airport?.ciudad ?? ""} ${airport?.pais ?? ""}`;
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8 px-3 text-xs font-semibold uppercase tracking-wide"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Aeropuerto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono font-semibold">
          {airportById(row.original.aeropuertoId)?.codigoIata ??
            row.original.aeropuertoId}
        </span>
      ),
    },
    {
      accessorKey: "nombre",
      header: "Terminal",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nombre}</span>
      ),
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.descripcion || "-"}
        </span>
      ),
    },
    {
      accessorKey: "activo",
      header: "Activo",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Status
            active={item.activo}
            onChange={async (active) => {
              try {
                const updated = await updateTerminal(item.id, {
                  aeropuertoId: item.aeropuertoId,
                  nombre: item.nombre,
                  descripcion: item.descripcion,
                  activo: active,
                });
                setTerminals((items) =>
                  items.map((currentItem) =>
                    currentItem.id === updated.id ? updated : currentItem,
                  ),
                );
              } catch {
                setNotice("No se pudo actualizar el estado de la terminal");
              }
            }}
            label={`Activo ${item.nombre}`}
          />
        );
      },
    },
    {
      id: "acciones",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-right">
            <Button
              variant="outline"
              size="icon"
              aria-label={`Editar ${item.nombre}`}
              onClick={() => {
                setTerminal({ ...item });
                setPanel("terminales");
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  const terminalTable = useLegacyTable({
    data: terminals,
    columns: terminalColumns,
    state: {
      globalFilter: globalFilterTerminal,
      sorting: sortingTerminal,
      pagination: paginationTerminal,
    },
    onGlobalFilterChange: setGlobalFilterTerminal,
    onSortingChange: setSortingTerminal,
    onPaginationChange: setPaginationTerminal,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const routeAirportLabel = (id: number) => {
    const airport = airportById(id);
    return airport
      ? `${airport.codigoIata} ${airport.nombre} ${airport.ciudad} ${airport.pais}`
      : String(id);
  };

  const routeColumns: LegacyColumnDef<Route>[] = [
    {
      id: "origen",
      accessorFn: (item) => routeAirportLabel(item.aeropuertoOrigenId),
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8 px-3 text-xs font-semibold uppercase tracking-wide"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Origen
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const airport = airportById(row.original.aeropuertoOrigenId);
        return (
          <div>
            <Badge>{airport?.codigoIata ?? row.original.aeropuertoOrigenId}</Badge>
            <div className="mt-1 text-xs text-muted-foreground">
              {airport ? `${airport.ciudad}, ${airport.pais}` : "—"}
            </div>
          </div>
        );
      },
    },
    {
      id: "destino",
      accessorFn: (item) => routeAirportLabel(item.aeropuertoDestinoId),
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8 px-3 text-xs font-semibold uppercase tracking-wide"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Destino
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const airport = airportById(row.original.aeropuertoDestinoId);
        return (
          <div>
            <Badge>{airport?.codigoIata ?? row.original.aeropuertoDestinoId}</Badge>
            <div className="mt-1 text-xs text-muted-foreground">
              {airport ? `${airport.ciudad}, ${airport.pais}` : "—"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "duracionEstimada",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8 px-3 text-xs font-semibold uppercase tracking-wide"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Duración est.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono">{fmtDuration(row.original.duracionEstimada)}</span>
      ),
    },
    {
      accessorKey: "distancia",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8 px-3 text-xs font-semibold uppercase tracking-wide"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Distancia
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) =>
        row.original.distancia ? (
          <span className="font-mono">
            {row.original.distancia.toLocaleString("en-US")} km
          </span>
        ) : (
          "—"
        ),
    },
    {
      accessorKey: "activa",
      header: "Activa",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Status
            active={item.activa}
            onChange={async (active) => {
              const previousActive = item.activa;
              setRoutes((items) =>
                items.map((currentItem) =>
                  currentItem.id === item.id
                    ? { ...currentItem, activa: active }
                    : currentItem,
                ),
              );
              try {
                const updated = await updateRoute(item.id, {
                  aeropuertoOrigenId: item.aeropuertoOrigenId,
                  aeropuertoDestinoId: item.aeropuertoDestinoId,
                  duracionEstimada: item.duracionEstimada,
                  distancia: item.distancia,
                  activa: active,
                });
                setRoutes((items) =>
                  items.map((currentItem) =>
                    currentItem.id === updated.id ? updated : currentItem,
                  ),
                );
              } catch {
                setRoutes((items) =>
                  items.map((currentItem) =>
                    currentItem.id === item.id
                      ? { ...currentItem, activa: previousActive }
                      : currentItem,
                  ),
                );
                setNotice("No se pudo actualizar el estado de la ruta");
              }
            }}
            label="Ruta activa"
          />
        );
      },
    },
    {
      id: "acciones",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-right">
            <Button
              variant="outline"
              size="icon"
              aria-label="Editar ruta"
              onClick={() => {
                setRoute({ ...item });
                setPanel("rutas");
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  const routeTable = useLegacyTable({
    data: routes,
    columns: routeColumns,
    state: {
      globalFilter: globalFilterRoute,
      sorting: sortingRoute,
      pagination: paginationRoute,
    },
    onGlobalFilterChange: setGlobalFilterRoute,
    onSortingChange: setSortingRoute,
    onPaginationChange: setPaginationRoute,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  void routeTable;

  const gateColumns: LegacyColumnDef<Gate>[] = [
    {
      id: "terminal",
      accessorFn: (item) => {
        const terminalItem = terminalById(item.sedeId);
        const airport = terminalItem
          ? airports.find((a) => a.id === terminalItem.aeropuertoId)
          : undefined;
        return `${terminalItem?.nombre ?? ""} ${airport?.codigoIata ?? ""} ${airport?.nombre ?? ""} ${airport?.ciudad ?? ""} ${airport?.pais ?? ""}`;
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8 px-3 text-xs font-semibold uppercase tracking-wide"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Terminal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const terminalItem = terminalById(row.original.sedeId);
        const airport = terminalItem
          ? airports.find((a) => a.id === terminalItem.aeropuertoId)
          : undefined;
        return (
          <div>
            <div className="font-semibold">
              {airport?.codigoIata ? `${airport.codigoIata} · ` : ""}
              {terminalItem?.nombre ?? "Terminal no disponible"}
            </div>
            <div className="text-xs text-muted-foreground">
              {airport
                ? `${airport.ciudad}, ${airport.pais}`
                : "Aeropuerto no disponible"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "numero",
      header: "Puerta",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.numero}
        </Badge>
      ),
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.descripcion || "-"}
        </span>
      ),
    },
    {
      accessorKey: "activo",
      header: "Activa",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Status
            active={item.activo}
            onChange={async (active) => {
              const previousActive = item.activo;
              setGates((items) =>
                items.map((currentItem) =>
                  currentItem.id === item.id
                    ? { ...currentItem, activo: active }
                    : currentItem,
                ),
              );
              try {
                const updated = await updateGate(item.id, {
                  sedeId: item.sedeId,
                  numero: item.numero,
                  descripcion: item.descripcion,
                  activo: active,
                });
                setGates((items) =>
                  items.map((currentItem) =>
                    currentItem.id === updated.id ? updated : currentItem,
                  ),
                );
              } catch {
                setGates((items) =>
                  items.map((currentItem) =>
                    currentItem.id === item.id
                      ? { ...currentItem, activo: previousActive }
                      : currentItem,
                  ),
                );
                setNotice("No se pudo actualizar el estado de la puerta");
              }
            }}
            label={`Activa ${item.numero}`}
          />
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="outline"
            size="icon"
            aria-label={`Editar ${row.original.numero}`}
            onClick={() => {
              setGate({ ...row.original });
              setPanel("puertas");
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const gateTable = useLegacyTable({
    data: gates,
    columns: gateColumns,
    state: {
      globalFilter: globalFilterGate,
      sorting: sortingGate,
      pagination: paginationGate,
    },
    onGlobalFilterChange: setGlobalFilterGate,
    onSortingChange: setSortingGate,
    onPaginationChange: setPaginationGate,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <AppBreadcrumb
        items={[
          { label: "Infraestructura", href: "/infraestructura" },
          { label: "Catálogos base" },
        ]}
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Catálogos base
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Infraestructura logística que alimenta rutas y vuelos.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" /> Nuevo {current.singular}
        </Button>
      </div>
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive"
        >
          {notice}
        </div>
      )}
      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <Card className="overflow-hidden rounded-xl">
          <TabsList className="flex h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-card p-0">
            <TabsTrigger
              value="aeropuertos"
              className="group rounded-none px-4 py-3.5 font-medium text-muted-foreground shadow-none hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-slate-900 data-[state=active]:font-semibold data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
            >
              Aeropuertos{" "}
              <Badge
                variant="secondary"
                className="ml-1 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white dark:group-data-[state=active]:bg-slate-900/20 dark:group-data-[state=active]:text-slate-900"
              >
                {airports.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="terminales"
              className="group rounded-none px-4 py-3.5 font-medium text-muted-foreground shadow-none hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-slate-900 data-[state=active]:font-semibold data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
            >
              Terminales{" "}
              <Badge
                variant="secondary"
                className="ml-1 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white dark:group-data-[state=active]:bg-slate-900/20 dark:group-data-[state=active]:text-slate-900"
              >
                {terminals.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="rutas"
              className="group rounded-none px-4 py-3.5 font-medium text-muted-foreground shadow-none hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-slate-900 data-[state=active]:font-semibold data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
            >
              Rutas{" "}
              <Badge
                variant="secondary"
                className="ml-1 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white dark:group-data-[state=active]:bg-slate-900/20 dark:group-data-[state=active]:text-slate-900"
              >
                {routes.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="puertas"
              className="group rounded-none px-4 py-3.5 font-medium text-muted-foreground shadow-none hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-slate-900 data-[state=active]:font-semibold data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
            >
              Puertas de embarque{" "}
              <Badge
                variant="secondary"
                className="ml-1 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white dark:group-data-[state=active]:bg-slate-900/20 dark:group-data-[state=active]:text-slate-900"
              >
                {gates.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <CardContent className="overflow-x-auto p-0">
            <TabsContent value="aeropuertos" className="mt-0">
              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, IATA, ciudad..."
                    value={globalFilter}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Table className="min-w-[700px]">
                <TableHeader>
                  {airportTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isLoadingAirports ? (
                    <TableRow>
                      <TableCell
                        colSpan={airportColumns.length}
                        className="p-8 text-center text-muted-foreground"
                      >
                        Cargando aeropuertos…
                      </TableCell>
                    </TableRow>
                  ) : airportTable.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={airportColumns.length}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No se encontraron aeropuertos que coincidan con la búsqueda
                      </TableCell>
                    </TableRow>
                  ) : (
                    airportTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className={cellClass}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between px-4 py-4 text-sm text-muted-foreground">
                <div>
                  Mostrando {airportTable.getRowModel().rows.length} de {airportTable.getFilteredRowModel().rows.length} registros
                </div>
                <div className="flex items-center space-x-2">
                  <span>
                    Página {airportTable.getState().pagination.pageIndex + 1} de {Math.max(1, airportTable.getPageCount())}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => airportTable.previousPage()}
                    disabled={!airportTable.getCanPreviousPage()}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => airportTable.nextPage()}
                    disabled={!airportTable.getCanNextPage()}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="terminales" className="mt-0">
              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por aeropuerto, terminal o descripción..."
                    value={globalFilterTerminal ?? ""}
                    onChange={(event) =>
                      setGlobalFilterTerminal(event.target.value)
                    }
                    className="pl-8"
                  />
                </div>
              </div>
              <Table className="min-w-[700px]">
                <TableHeader>
                  {terminalTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isLoadingTerminals ? (
                    <TableRow>
                      <TableCell
                        colSpan={terminalColumns.length}
                        className="p-8 text-center text-muted-foreground"
                      >
                        Cargando terminales…
                      </TableCell>
                    </TableRow>
                  ) : terminalTable.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={terminalColumns.length}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No se encontraron terminales que coincidan con la búsqueda
                      </TableCell>
                    </TableRow>
                  ) : (
                    terminalTable.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className={cellClass}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between px-4 py-4 text-sm text-muted-foreground">
                <div>
                  Mostrando {terminalTable.getRowModel().rows.length} de {terminalTable.getFilteredRowModel().rows.length} registros
                </div>
                <div className="flex items-center space-x-2">
                  <span>
                    Página {terminalTable.getState().pagination.pageIndex + 1} de {Math.max(1, terminalTable.getPageCount())}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => terminalTable.previousPage()}
                    disabled={!terminalTable.getCanPreviousPage()}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => terminalTable.nextPage()}
                    disabled={!terminalTable.getCanNextPage()}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="rutas" className="mt-0">
              <div className="flex items-center justify-between gap-4 py-4">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por origen, destino, país..."
                    value={globalFilterRoute ?? ""}
                    onChange={(event) =>
                      setGlobalFilterRoute(event.target.value)
                    }
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    {routeTable.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {isLoadingRoutes ? (
                      <TableRow>
                        <TableCell
                          colSpan={routeColumns.length}
                          className="p-8 text-center text-muted-foreground"
                        >
                          Cargando rutas…
                        </TableCell>
                      </TableRow>
                    ) : routeTable.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={routeColumns.length}
                          className="p-8 text-center text-muted-foreground"
                        >
                          No se encontraron rutas que coincidan con la búsqueda
                        </TableCell>
                      </TableRow>
                    ) : (
                      routeTable.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className={cellClass}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between py-4 text-sm text-muted-foreground">
                <div>
                  Mostrando {routeTable.getRowModel().rows.length} de {routes.length} registros
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    Página {routeTable.getState().pagination.pageIndex + 1} de {Math.max(1, routeTable.getPageCount())}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => routeTable.previousPage()}
                    disabled={!routeTable.getCanPreviousPage()}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => routeTable.nextPage()}
                    disabled={!routeTable.getCanNextPage()}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="puertas" className="mt-0">
              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por terminal, puerta, aeropuerto, país..."
                    value={globalFilterGate}
                    onChange={(event) => setGlobalFilterGate(event.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    {gateTable.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {isLoadingGates ? (
                      <TableRow>
                        <TableCell
                          colSpan={gateColumns.length}
                          className="p-8 text-center text-muted-foreground"
                        >
                          Cargando puertas…
                        </TableCell>
                      </TableRow>
                    ) : gateTable.getRowModel().rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={gateColumns.length}
                          className="p-8 text-center text-muted-foreground"
                        >
                          No se encontraron puertas de embarque registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      gateTable.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className={cellClass}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between px-4 py-4 text-sm text-muted-foreground">
                <div>
                  Mostrando {gateTable.getRowModel().rows.length} de {gateTable.getFilteredRowModel().rows.length} registros
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    Página {gateTable.getState().pagination.pageIndex + 1} de {Math.max(1, gateTable.getPageCount())}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => gateTable.previousPage()}
                    disabled={!gateTable.getCanPreviousPage()}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => gateTable.nextPage()}
                    disabled={!gateTable.getCanNextPage()}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <Sheet open={!!panel} onOpenChange={(open) => !open && close()}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {panel === "puertas"
                ? `${gate.id ? "Editar" : "Nueva"} puerta de embarque`
                : panel === "aeropuertos" && airport.id
                  ? `Editar ${airport.iata}`
                  : `${panel ? "Nuevo" : ""} ${tabs.find((item) => item.id === panel)?.singular ?? ""}`}
            </SheetTitle>
            <SheetDescription>
              {panel === "aeropuertos"
                ? "Tabla Aeropuerto"
                : panel === "terminales"
                  ? "Tabla Terminal"
                  : panel === "rutas"
                    ? "Tabla Ruta"
                    : "Tabla Puerta de embarque"}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-6">
            {panel === "aeropuertos" && (
              <>
                <Field label="Nombre">
                  <Input
                    value={airport.nombre}
                    onChange={(event) =>
                      setAirport({ ...airport, nombre: event.target.value })
                    }
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Código IATA" hint="3 letras">
                    <Input
                      maxLength={3}
                      value={airport.iata}
                      onChange={(event) =>
                        setAirport({
                          ...airport,
                          iata: event.target.value.toUpperCase(),
                        })
                      }
                      className="font-mono"
                    />
                  </Field>
                  <Field label="Código ICAO" hint="4 letras">
                    <Input
                      maxLength={4}
                      value={airport.icao}
                      onChange={(event) =>
                        setAirport({
                          ...airport,
                          icao: event.target.value.toUpperCase(),
                        })
                      }
                      className="font-mono"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="País"
                    hint="Los nombres de países y ciudades pueden aparecer en inglés."
                  >
                    <SearchableSelect
                      value={airport.pais}
                      placeholder="Seleccione un país"
                      searchPlaceholder="Buscar país, ISO o prefijo..."
                      options={countries.map((country) => ({
                        value: country.name,
                        label: country.name,
                        description: `${country.isoCode} · +${country.phonecode}`,
                        searchText: `${country.name} ${country.isoCode} ${country.phonecode}`,
                      }))}
                      onChange={(value) =>
                        setAirport((prev) => ({
                          ...prev,
                          pais: value,
                          ciudad: "",
                        }))
                      }
                    />
                  </Field>
                  <Field
                    label="Ciudad"
                    hint="Los nombres de ciudades pueden aparecer en inglés."
                  >
                    <SearchableSelect
                      value={airport.ciudad}
                      placeholder="Seleccione una ciudad"
                      searchPlaceholder="Buscar ciudad..."
                      options={availableCities.map((city) => ({
                        value: city.name,
                        label: city.name,
                      }))}
                      disabled={!selectedCountryIso}
                      onChange={(value) =>
                        setAirport((prev) => ({ ...prev, ciudad: value }))
                      }
                    />
                  </Field>
                </div>
                <Field label="Dirección">
                  <Input
                    value={airport.direccion}
                    onChange={(event) =>
                      setAirport({ ...airport, direccion: event.target.value })
                    }
                  />
                </Field>
                <div className="flex items-center justify-between rounded-lg bg-background p-4">
                  <span className="text-sm font-medium">Aeropuerto activo</span>
                  <Switch
                    checked={airport.activo}
                    onCheckedChange={(active) =>
                      setAirport({ ...airport, activo: active })
                    }
                    aria-label="Aeropuerto activo"
                  />
                </div>
              </>
            )}
            {panel === "terminales" && (
              <>
                <Field label="Aeropuerto">
                  <SearchableSelect
                    value={terminal.aeropuertoId?.toString() ?? ""}
                    placeholder="Selecciona un aeropuerto"
                    searchPlaceholder="Buscar por país, ciudad, ICAO, IATA o nombre..."
                    options={airports.map((airportItem) => ({
                      value: airportItem.id.toString(),
                      label: `${airportItem.codigoIata} · ${airportItem.nombre}`,
                      description: `${airportItem.codigoIcao || "ICAO no disponible"} · ${airportItem.ciudad || "Ciudad no disponible"}, ${airportItem.pais || "País no disponible"}`,
                      searchText: `${airportItem.codigoIata} ${airportItem.codigoIcao || ""} ${airportItem.nombre} ${airportItem.ciudad || ""} ${airportItem.pais || ""}`,
                    }))}
                    onChange={(value) =>
                      setTerminal((prev) => ({
                        ...prev,
                        aeropuertoId: Number(value) || undefined,
                      }))
                    }
                  />
                </Field>
                <Field label="Nombre">
                  <Input
                    value={terminal.nombre ?? ""}
                    onChange={(event) =>
                      setTerminal({ ...terminal, nombre: event.target.value })
                    }
                  />
                </Field>
                <Field label="Descripción">
                  <Input
                    value={terminal.descripcion ?? ""}
                    onChange={(event) =>
                      setTerminal({
                        ...terminal,
                        descripcion: event.target.value,
                      })
                    }
                  />
                </Field>
                <div className="flex items-center justify-between rounded-lg bg-background p-4">
                  <span className="text-sm font-medium">Terminal activa</span>
                  <Switch
                    checked={!!terminal.activo}
                    onCheckedChange={(active) =>
                      setTerminal({ ...terminal, activo: active })
                    }
                    aria-label="Terminal activa"
                  />
                </div>
              </>
            )}
            {panel === "rutas" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Aeropuerto de origen
                  </label>
                  <SearchableSelect
                    value={route.aeropuertoOrigenId?.toString() ?? ""}
                    placeholder="Selecciona origen"
                    searchPlaceholder="Buscar por IATA, ICAO, nombre, ciudad o país..."
                    options={airports.map((airport) => ({
                      value: airport.id.toString(),
                      label: `${airport.codigoIata} · ${airport.nombre}`,
                      description: `${airport.codigoIcao || "ICAO no disponible"} · ${airport.ciudad || "Ciudad no disponible"}, ${airport.pais || "País no disponible"}`,
                      searchText: `${airport.codigoIata} ${airport.codigoIcao || ""} ${airport.nombre} ${airport.ciudad || ""} ${airport.pais || ""}`,
                    }))}
                    onChange={(value) =>
                      setRoute((prev) => ({
                        ...prev,
                        aeropuertoOrigenId: Number(value) || undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Aeropuerto de destino
                  </label>
                  <SearchableSelect
                    value={route.aeropuertoDestinoId?.toString() ?? ""}
                    placeholder="Selecciona destino"
                    searchPlaceholder="Buscar por IATA, ICAO, nombre, ciudad o país..."
                    options={airports
                      .filter(
                        (airport) => airport.id !== route.aeropuertoOrigenId,
                      )
                      .map((airport) => ({
                        value: airport.id.toString(),
                        label: `${airport.codigoIata} · ${airport.nombre}`,
                        description: `${airport.codigoIcao || "ICAO no disponible"} · ${airport.ciudad || "Ciudad no disponible"}, ${airport.pais || "País no disponible"}`,
                        searchText: `${airport.codigoIata} ${airport.codigoIcao || ""} ${airport.nombre} ${airport.ciudad || ""} ${airport.pais || ""}`,
                      }))}
                    onChange={(value) =>
                      setRoute((prev) => ({
                        ...prev,
                        aeropuertoDestinoId: Number(value) || undefined,
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Duración (min)">
                    <Input
                      type="number"
                      min={1}
                      value={route.duracionEstimada ?? ""}
                      onChange={(event) =>
                        setRoute({
                          ...route,
                          duracionEstimada:
                            Number(event.target.value) || undefined,
                        })
                      }
                      className="font-mono"
                    />
                  </Field>
                  <Field label="Distancia (km)">
                    <Input
                      type="number"
                      min={0}
                      value={route.distancia ?? ""}
                      onChange={(event) =>
                        setRoute({
                          ...route,
                          distancia: Number(event.target.value) || 0,
                        })
                      }
                      className="font-mono"
                    />
                  </Field>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background p-4">
                  <span className="text-sm font-medium">Ruta activa</span>
                  <Switch
                    checked={!!route.activa}
                    onCheckedChange={(active) =>
                      setRoute({ ...route, activa: active })
                    }
                    aria-label="Ruta activa"
                  />
                </div>
              </>
            )}
            {panel === "puertas" && (
              <>
                <Field label="Terminal">
                  <Popover
                    open={openGateTerminal}
                    onOpenChange={(open) => {
                      setOpenGateTerminal(open);
                      if (!open) setGateTerminalSearch("");
                    }}
                    modal={false}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openGateTerminal}
                        className="w-full justify-between font-normal"
                      >
                        {(() => {
                          const selectedTerminal = terminalById(gate.sedeId ?? 0);
                          const airport = selectedTerminal
                            ? airports.find(
                                (a) => a.id === selectedTerminal.aeropuertoId,
                              )
                            : undefined;
                          return selectedTerminal
                            ? `${airport?.codigoIata ? `${airport.codigoIata} · ` : ""}${selectedTerminal.nombre}`
                            : "Selecciona una terminal";
                        })()}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <div className="bg-popover text-popover-foreground">
                        <div className="flex items-center border-b px-3">
                          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                          <Input
                            autoFocus
                            value={gateTerminalSearch}
                            onChange={(event) =>
                              setGateTerminalSearch(event.target.value)
                            }
                            placeholder="Buscar terminal, aeropuerto, ciudad o país..."
                            className="h-11 border-0 px-0 shadow-none focus-visible:ring-0"
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-1">
                          {terminals.filter((t) => {
                            const airport = airports.find(
                              (a) => a.id === t.aeropuertoId,
                            );
                            const searchText = `${t.nombre} ${airport?.codigoIata || ""} ${airport?.nombre || ""} ${airport?.ciudad || ""} ${airport?.pais || ""}`;
                            return searchText
                              .toLocaleLowerCase()
                              .includes(gateTerminalSearch.toLocaleLowerCase());
                          }).length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                              No se encontraron terminales.
                            </p>
                          ) : (
                            terminals
                              .filter((t) => {
                                const airport = airports.find(
                                  (a) => a.id === t.aeropuertoId,
                                );
                                const searchText = `${t.nombre} ${airport?.codigoIata || ""} ${airport?.nombre || ""} ${airport?.ciudad || ""} ${airport?.pais || ""}`;
                                return searchText
                                  .toLocaleLowerCase()
                                  .includes(
                                    gateTerminalSearch.toLocaleLowerCase(),
                                  );
                              })
                              .map((t) => {
                                const airport = airports.find(
                                  (a) => a.id === t.aeropuertoId,
                                );
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    className="flex w-full cursor-pointer items-center rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                    onClick={() => {
                                      setGate((currentGate) => ({
                                        ...currentGate,
                                        sedeId: t.id,
                                      }));
                                      setOpenGateTerminal(false);
                                      setGateTerminalSearch("");
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 shrink-0 ${gate.sedeId === t.id ? "opacity-100" : "opacity-0"}`}
                                    />
                                    <span>
                                      <span className="block font-semibold">
                                        {airport?.codigoIata
                                          ? `${airport.codigoIata} · `
                                          : ""}
                                        {t.nombre}
                                      </span>
                                      <span className="block text-xs text-muted-foreground">
                                        {airport?.nombre || "Aeropuerto"},{" "}
                                        {airport?.ciudad || ""},{" "}
                                        {airport?.pais || ""}
                                      </span>
                                    </span>
                                  </button>
                                );
                              })
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </Field>
                <Field label="Número de puerta">
                  <Input
                    value={gate.numero ?? ""}
                    autoComplete="off"
                    placeholder="Ej. A12, B4, Gate 1"
                    onChange={(event) =>
                      setGate({
                        ...gate,
                        numero: event.target.value.toUpperCase(),
                      })
                    }
                    className="font-mono"
                  />
                </Field>
                <Field label="Descripción">
                  <Input
                    value={gate.descripcion ?? ""}
                    onChange={(event) =>
                      setGate({ ...gate, descripcion: event.target.value })
                    }
                  />
                </Field>
                <div className="flex items-center justify-between rounded-lg bg-background p-4">
                  <span className="text-sm font-medium">Puerta activa</span>
                  <Switch
                    checked={!!gate.activo}
                    onCheckedChange={(active) =>
                      setGate({ ...gate, activo: active })
                    }
                    aria-label="Puerta activa"
                  />
                </div>
              </>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={close}>
              Cancelar
            </Button>
            <Button disabled={!canSave} onClick={save}>
              Guardar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
