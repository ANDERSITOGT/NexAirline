import { useEffect, useState, type ReactNode } from "react";
import { Country } from "country-state-city";
import { AppBreadcrumb } from "@/components/navigation/AppBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Armchair,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { flexRender } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type LegacyColumnDef,
  useLegacyTable,
} from "@tanstack/react-table/legacy";
import type { PaginationState, SortingState } from "@tanstack/table-core";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  mantenimientos as seedMaintenance,
  seatTypeTotals,
  type MantEstado,
  type MantTipo,
  type Mantenimiento,
} from "@/data3";
import { usuarios } from "@/data2";
import {
  createAirline,
  getAirlines,
  updateAirline,
  type Airline,
  type CreateAirlineDTO,
} from "@/services/airlineService";
import {
  createPlane,
  getPlanes,
  updatePlane,
  type CreatePlaneDTO,
  type Plane,
} from "@/services/planeService";
import {
  createSeatType,
  getSeatTypes,
  updateSeatType,
  type CreateSeatTypeDTO,
  type SeatType,
} from "@/services/seatTypeService";

type Tab = "aeronaves" | "aerolineas" | "mantenimiento" | "tipos";
type Option = {
  value: number;
  label: string;
  description?: string;
  searchText?: string;
  sub?: string;
  meta?: string;
};
type AirlineForm = Partial<CreateAirlineDTO> & {
  activo?: boolean;
  id?: number;
};
type PlaneForm = Partial<CreatePlaneDTO> & { activo?: boolean; id?: number };
type SeatTypeForm = Partial<CreateSeatTypeDTO> & { id?: number };

const tabLabels: Record<Tab, string> = {
  aeronaves: "aeronave",
  aerolineas: "aerolínea",
  mantenimiento: "mantenimiento",
  tipos: "tipo de asiento",
};
const tableCell = "p-4 align-middle";

function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

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
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {hint && (
        <span className="text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      )}
    </label>
  );
}

function SelectField({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: Option[];
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filteredOptions = options.filter((option) =>
    `${option.label} ${option.description ?? ""} ${option.searchText ?? ""} ${option.sub ?? ""} ${option.meta ?? ""}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  const selectedOption = options.find((option) => option.value === value);
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
              placeholder="Buscar por nombre, código o país..."
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
                  <Check
                    className={`mr-2 h-4 w-4 shrink-0 ${option.value === value ? "opacity-100" : "opacity-0"}`}
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold">{option.label}</span>
                    {(option.description || option.sub || option.meta) && (
                      <span className="block text-xs text-muted-foreground">
                        {option.description ??
                          [option.sub, option.meta].filter(Boolean).join(" · ")}
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

function CountryField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const countries = Country.getAllCountries();
  const filteredCountries = countries.filter((country) =>
    `${country.name} ${country.isoCode} ${country.phonecode}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  const selectedCountry = countries.find((country) => country.name === value);
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
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={selectedCountry ? "text-foreground" : "text-muted-foreground"}>
            {selectedCountry?.name ?? "Selecciona un país"}
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
              placeholder="Buscar país, ISO o prefijo..."
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") close();
                if (event.key === "Enter" && filteredCountries[0]) {
                  onChange(filteredCountries[0].name);
                  close();
                }
              }}
              className="h-11 border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filteredCountries.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No se encontraron países.
              </p>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.isoCode}
                  type="button"
                  role="option"
                  aria-selected={country.name === value}
                  className="flex w-full cursor-pointer items-center rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  onClick={() => {
                    onChange(country.name);
                    close();
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 shrink-0 ${country.name === value ? "opacity-100" : "opacity-0"}`}
                  />
                  <span>
                    <span className="block font-semibold">{country.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {country.isoCode} · +{country.phonecode}
                    </span>
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

function StatusBadge({ value }: { value: string }) {
  const variant =
    value === "Operativa" || value === "COMPLETADO"
      ? "secondary"
      : value === "Mantenimiento" || value === "EN_CURSO"
        ? "default"
        : "outline";
  return <Badge variant={variant}>{value}</Badge>;
}

export default function Fleet() {
  const [tab, setTab] = useState<Tab>("aeronaves");
  const [planes, setPlanes] = useState<Plane[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [isLoadingPlanes, setIsLoadingPlanes] = useState(true);
  const [isLoadingAirlines, setIsLoadingAirlines] = useState(true);
  const [maintenance, setMaintenance] = useState(seedMaintenance);
  const [seatTypes, setSeatTypes] = useState<SeatType[]>([]);
  const [isLoadingSeatTypes, setIsLoadingSeatTypes] = useState(true);
  const [panel, setPanel] = useState<Tab | null>(null);
  const [globalFilterPlane, setGlobalFilterPlane] = useState("");
  const [sortingPlane, setSortingPlane] = useState<SortingState>([]);
  const [paginationPlane, setPaginationPlane] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [globalFilterAirline, setGlobalFilterAirline] = useState("");
  const [sortingAirline, setSortingAirline] = useState<SortingState>([]);
  const [paginationAirline, setPaginationAirline] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [planeForm, setPlaneForm] = useState<PlaneForm>({});
  const [airlineForm, setAirlineForm] = useState<AirlineForm>({});
  const [maintenanceForm, setMaintenanceForm] = useState<
    Partial<Mantenimiento>
  >({});
  const [seatTypeForm, setSeatTypeForm] = useState<SeatTypeForm>({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadFleet = async () => {
      try {
        const [loadedPlanes, loadedAirlines, loadedSeatTypes] =
          await Promise.all([getPlanes(), getAirlines(), getSeatTypes()]);
        setPlanes(loadedPlanes);
        setAirlines(loadedAirlines);
        setSeatTypes(loadedSeatTypes);
      } catch {
        setNotice("No se pudo cargar la flota");
      } finally {
        setIsLoadingPlanes(false);
        setIsLoadingAirlines(false);
        setIsLoadingSeatTypes(false);
      }
    };
    void loadFleet();
  }, []);

  const airlineName = (id: number) =>
    airlines.find((airline) => airline.id === id)?.nombre ?? "—";
  const airlineOptions = airlines
    .filter((airline) => airline.activo)
    .map((airline) => ({
      value: airline.id,
      label: `${airline.codigoIata} · ${airline.nombre}`,
      description: airline.pais,
      searchText: `${airline.codigoIata} ${airline.codigoIcao} ${airline.nombre} ${airline.pais}`,
    }));
  const planeOptions = planes
    .filter((plane) => plane.activo)
    .map((plane) => ({
      value: plane.id,
      label: plane.matricula,
      sub: plane.nombre,
      meta: `${plane.capacidad} pax`,
    }));
  const planeStatus = (plane: Plane) =>
    maintenance.some(
      (item) => item.avion === plane.id && item.estado === "EN_CURSO",
    )
      ? "Mantenimiento"
      : "Operativa";
  const isNew = (item: { id?: number }) => !item.id;
  const openNew = () => {
    if (tab === "aeronaves") setPlaneForm({ activo: true });
    if (tab === "aerolineas") setAirlineForm({ activo: true });
    if (tab === "mantenimiento")
      setMaintenanceForm({
        tipo: "PREVENTIVO",
        estado: "PROGRAMADO",
        responsable: 2,
        inicio: "2026-10-20",
        fin: "2026-10-21",
      });
    if (tab === "tipos") setSeatTypeForm({});
    setPanel(tab);
  };
  const upsert = <T extends { id: number }>(
    list: T[],
    setter: (items: T[]) => void,
    item: Partial<T>,
  ) =>
    setter(
      item.id
        ? list.map((current) =>
            current.id === item.id ? { ...current, ...item } : current,
          )
        : [...list, { ...item, id: Date.now() } as T],
    );
  const valid =
    panel === "aeronaves"
      ? !!planeForm.aerolineaId &&
        !!planeForm.matricula &&
        (planeForm.capacidad ?? 0) > 0
      : panel === "aerolineas"
        ? !!airlineForm.nombre &&
          airlineForm.codigoIata?.length === 2 &&
          airlineForm.codigoIcao?.length === 3 &&
          !!airlineForm.pais
        : panel === "mantenimiento"
          ? !!maintenanceForm.avion &&
            !!maintenanceForm.descripcion &&
            !!maintenanceForm.inicio &&
            !!maintenanceForm.fin &&
            maintenanceForm.fin >= maintenanceForm.inicio
          : !!seatTypeForm.nombre;

  const save = async () => {
    if (panel === "aeronaves") {
      try {
        const payload = {
          aerolineaId: planeForm.aerolineaId!,
          matricula: planeForm.matricula!,
          nombre: planeForm.nombre,
          capacidad: planeForm.capacidad!,
        };
        if (planeForm.id && planeForm.id > 0) {
          const updated = await updatePlane(planeForm.id, {
            ...payload,
            activo: !!planeForm.activo,
          });
          setPlanes((current) =>
            current.map((plane) => (plane.id === updated.id ? updated : plane)),
          );
        } else {
          const created = await createPlane(payload);
          setPlanes((current) => [...current, created]);
        }
      } catch {
        setNotice("No se pudo guardar la aeronave");
        return;
      }
    }
    if (panel === "aerolineas") {
      try {
        const payload = {
          nombre: airlineForm.nombre!,
          codigoIata: airlineForm.codigoIata!,
          codigoIcao: airlineForm.codigoIcao!,
          pais: airlineForm.pais!,
          activo: airlineForm.activo,
        };
        if (airlineForm.id && airlineForm.id > 0) {
          const updated = await updateAirline(airlineForm.id, payload);
          setAirlines((current) =>
            current.map((airline) =>
              airline.id === updated.id ? updated : airline,
            ),
          );
        } else {
          const created = await createAirline(payload);
          setAirlines((current) => [...current, created]);
        }
      } catch {
        setNotice("No se pudo guardar la aerolínea");
        return;
      }
    }
    if (panel === "mantenimiento")
      upsert(maintenance, setMaintenance, maintenanceForm);
    if (panel === "tipos") {
      try {
        const payload = {
          nombre: seatTypeForm.nombre!,
          descripcion: seatTypeForm.descripcion,
        };
        const result =
          seatTypeForm.id && seatTypeForm.id > 0
            ? await updateSeatType(seatTypeForm.id, payload)
            : await createSeatType(payload);
        setSeatTypes((current) =>
          seatTypeForm.id && seatTypeForm.id > 0
            ? current.map((item) => (item.id === result.id ? result : item))
            : [...current, result],
        );
      } catch {
        setNotice("No se pudo guardar el tipo de asiento");
        return;
      }
    }
    setNotice("Cambios guardados");
    setPanel(null);
  };

  const seatCounts = seatTypeTotals(planes.filter((plane) => plane.activo));
  const activePlanes = planes.filter((plane) => plane.activo);

  const planeColumns: LegacyColumnDef<Plane>[] = [
    {
      accessorKey: "matricula",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8 px-3 text-xs font-semibold uppercase tracking-wide"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Matrícula <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.matricula}</span>,
    },
    {
      accessorKey: "nombre",
      header: "Aeronave",
      cell: ({ row }) => row.original.nombre ?? "—",
    },
    {
      id: "aerolinea",
      accessorFn: (plane) => airlineName(plane.aerolineaId),
      header: "Aerolínea",
      cell: ({ row }) => airlineName(row.original.aerolineaId),
    },
    {
      accessorKey: "capacidad",
      header: "Capacidad",
      cell: ({ row }) => <span className="font-mono">{row.original.capacidad}</span>,
    },
    {
      id: "estado",
      accessorFn: (plane) => (plane.activo ? planeStatus(plane) : "Inactivo"),
      header: "Estado operativo",
      cell: ({ row }) => (
        <StatusBadge value={row.original.activo ? planeStatus(row.original) : "Inactivo"} />
      ),
    },
    {
      accessorKey: "activo",
      header: "Activo",
      cell: ({ row }) => {
        const plane = row.original;
        return (
          <Switch
            checked={plane.activo}
            onCheckedChange={async (active) => {
              try {
                const updated = await updatePlane(plane.id, {
                  aerolineaId: plane.aerolineaId,
                  matricula: plane.matricula,
                  nombre: plane.nombre,
                  capacidad: plane.capacidad,
                  activo: active,
                });
                setPlanes((current) =>
                  current.map((item) => (item.id === updated.id ? updated : item)),
                );
              } catch {
                setNotice("No se pudo actualizar el estado de la aeronave");
              }
            }}
            aria-label={`Activo ${plane.matricula}`}
          />
        );
      },
    },
    {
      id: "acciones",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-right">
          <Button variant="outline" size="icon" className="mr-1" aria-label="Ver mapa de asientos">
            <Armchair className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Editar ${row.original.matricula}`}
            onClick={() => {
              setPlaneForm({ ...row.original });
              setPanel("aeronaves");
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const airlineColumns: LegacyColumnDef<Airline>[] = [
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8 px-3 text-xs font-semibold uppercase tracking-wide"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Aerolínea <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span>,
    },
    { accessorKey: "codigoIata", header: "IATA", cell: ({ row }) => <span className="font-mono">{row.original.codigoIata}</span> },
    { accessorKey: "codigoIcao", header: "ICAO", cell: ({ row }) => <span className="font-mono">{row.original.codigoIcao}</span> },
    { accessorKey: "pais", header: "País", cell: ({ row }) => <span className="text-muted-foreground">{row.original.pais}</span> },
    {
      id: "aeronaves",
      accessorFn: (airline) => planes.filter((plane) => plane.aerolineaId === airline.id).length,
      header: "Aeronaves",
      cell: ({ row }) => <span className="font-mono">{planes.filter((plane) => plane.aerolineaId === row.original.id).length}</span>,
    },
    {
      accessorKey: "activo",
      header: "Activa",
      cell: ({ row }) => {
        const airline = row.original;
        return (
          <Switch
            checked={airline.activo}
            onCheckedChange={async (active) => {
              try {
                const updated = await updateAirline(airline.id, { ...airline, activo: active });
                setAirlines((current) => current.map((item) => (item.id === updated.id ? updated : item)));
              } catch {
                setNotice("No se pudo actualizar el estado de la aerolínea");
              }
            }}
            aria-label={`Activa ${airline.nombre}`}
          />
        );
      },
    },
    {
      id: "acciones",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="outline"
            size="icon"
            aria-label={`Editar ${row.original.nombre}`}
            onClick={() => {
              setAirlineForm(row.original);
              setPanel("aerolineas");
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const planeTable = useLegacyTable({
    data: planes,
    columns: planeColumns,
    state: { globalFilter: globalFilterPlane, sorting: sortingPlane, pagination: paginationPlane },
    onGlobalFilterChange: setGlobalFilterPlane,
    onSortingChange: setSortingPlane,
    onPaginationChange: setPaginationPlane,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const airlineTable = useLegacyTable({
    data: airlines,
    columns: airlineColumns,
    state: { globalFilter: globalFilterAirline, sorting: sortingAirline, pagination: paginationAirline },
    onGlobalFilterChange: setGlobalFilterAirline,
    onSortingChange: setSortingAirline,
    onPaginationChange: setPaginationAirline,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <AppBreadcrumb
        items={[{ label: "Flota", href: "/flota" }, { label: "Aviones y aerolíneas" }]}
      />
      <PageHeader
        title="Flota"
        subtitle="Aeronaves, aerolíneas operadoras, mantenimiento y catálogo de asientos."
      >
        <Button onClick={openNew}>
          <Plus className="size-4" /> Nueva {tabLabels[tab]}
        </Button>
      </PageHeader>
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-md border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm"
        >
          {notice}
        </div>
      )}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Aeronaves activas", activePlanes.length],
          [
            "Operativas",
            activePlanes.filter((plane) => planeStatus(plane) === "Operativa")
              .length,
          ],
          [
            "En mantenimiento",
            planes.filter((plane) => planeStatus(plane) === "Mantenimiento")
              .length,
          ],
          [
            "Capacidad total",
            activePlanes.reduce((total, plane) => total + plane.capacidad, 0),
          ],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-xl">
            <CardContent className="px-4 py-3">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="font-mono text-2xl font-medium">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <TabsList className="h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0">
            {[
              ["aeronaves", "Aeronaves", planes.length],
              ["aerolineas", "Aerolíneas", airlines.length],
              ["mantenimiento", "Mantenimiento", maintenance.length],
              ["tipos", "Tipos de asiento", seatTypes.length],
            ].map(([value, label, count]) => (
              <TabsTrigger
                key={value}
                value={value as string}
                className="group rounded-none px-4 py-3.5 font-medium text-muted-foreground shadow-none hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-slate-900 data-[state=active]:font-semibold data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-900"
              >
                {label}
                <Badge
                  variant="secondary"
                  className="ml-1 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white dark:group-data-[state=active]:bg-slate-900/20 dark:group-data-[state=active]:text-slate-900"
                >
                  {count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {tab === "aeronaves" && (
          <div>
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aeronave, matrícula, modelo..."
                  value={globalFilterPlane}
                  onChange={(event) => setGlobalFilterPlane(event.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
            <Table className="min-w-[850px]">
              <TableHeader>
                {planeTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoadingPlanes ? (
                  <TableRow>
                    <TableCell
                      colSpan={planeColumns.length}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Cargando aeronaves…
                    </TableCell>
                  </TableRow>
                ) : planeTable.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={planeColumns.length} className="p-8 text-center text-muted-foreground">
                      No se encontraron aeronaves registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  planeTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={tableCell}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
            <div className="flex items-center justify-between px-4 py-4 text-sm text-muted-foreground">
              <span>Mostrando {planeTable.getRowModel().rows.length} de {planeTable.getFilteredRowModel().rows.length} registros</span>
              <div className="flex items-center gap-2">
                <span>Página {planeTable.getState().pagination.pageIndex + 1} de {Math.max(1, planeTable.getPageCount())}</span>
                <Button variant="outline" size="sm" onClick={() => planeTable.previousPage()} disabled={!planeTable.getCanPreviousPage()} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => planeTable.nextPage()} disabled={!planeTable.getCanNextPage()} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        )}
        {tab === "aerolineas" && (
          <div>
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aerolínea por nombre, IATA, país..."
                  value={globalFilterAirline}
                  onChange={(event) => setGlobalFilterAirline(event.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                {airlineTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoadingAirlines ? (
                  <TableRow>
                    <TableCell
                      colSpan={airlineColumns.length}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Cargando aerolíneas…
                    </TableCell>
                  </TableRow>
                ) : airlineTable.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={airlineColumns.length} className="p-8 text-center text-muted-foreground">
                      No se encontraron aerolíneas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  airlineTable.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={tableCell}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
            <div className="flex items-center justify-between px-4 py-4 text-sm text-muted-foreground">
              <span>Mostrando {airlineTable.getRowModel().rows.length} de {airlineTable.getFilteredRowModel().rows.length} registros</span>
              <div className="flex items-center gap-2">
                <span>Página {airlineTable.getState().pagination.pageIndex + 1} de {Math.max(1, airlineTable.getPageCount())}</span>
                <Button variant="outline" size="sm" onClick={() => airlineTable.previousPage()} disabled={!airlineTable.getCanPreviousPage()} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => airlineTable.nextPage()} disabled={!airlineTable.getCanNextPage()} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        )}
        {tab === "mantenimiento" && (
          <>
            <div className="border-b border-border bg-accent/5 px-4 py-2.5 text-xs text-muted-foreground">
              Tabla propuesta{" "}
              <span className="font-mono text-foreground">Mantenimiento</span>.
              Mientras haya una orden EN_CURSO, la aeronave no puede asignarse a
              vuelos nuevos.
            </div>
            <div className="overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    {[
                      "Aeronave",
                      "Tipo",
                      "Trabajo",
                      "Inicio",
                      "Fin estimado",
                      "Estado",
                      "Responsable",
                      "",
                    ].map((head) => (
                      <TableHead key={head}>{head}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenance.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell
                        className={`${tableCell} font-mono font-semibold`}
                      >
                        {planes.find((plane) => plane.id === item.avion)
                          ?.matricula ?? "—"}
                      </TableCell>
                      <TableCell className={tableCell}>
                        <StatusBadge value={item.tipo} />
                      </TableCell>
                      <TableCell className={tableCell}>
                        {item.descripcion}
                      </TableCell>
                      <TableCell className={`${tableCell} font-mono`}>
                        {item.inicio}
                      </TableCell>
                      <TableCell className={`${tableCell} font-mono`}>
                        {item.fin}
                      </TableCell>
                      <TableCell className={tableCell}>
                        <StatusBadge value={item.estado} />
                      </TableCell>
                      <TableCell
                        className={`${tableCell} text-muted-foreground`}
                      >
                        {
                          usuarios.find((user) => user.id === item.responsable)
                            ?.nombre
                        }
                      </TableCell>
                      <TableCell
                        className={`${tableCell} whitespace-nowrap text-right`}
                      >
                        {item.estado === "EN_CURSO" && (
                          <Button
                            className="mr-1 h-8"
                            onClick={() => {
                              setMaintenance((current) =>
                                current.map((entry) =>
                                  entry.id === item.id
                                    ? { ...entry, estado: "COMPLETADO" }
                                    : entry,
                                ),
                              );
                              setNotice(
                                "Mantenimiento completado · aeronave operativa",
                              );
                            }}
                          >
                            Completar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Editar mantenimiento"
                          onClick={() => {
                            setMaintenanceForm(item);
                            setPanel("mantenimiento");
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        {tab === "tipos" && (
          <div className="overflow-x-auto">
            <Table className="min-w-[620px]">
              <TableHeader>
                <TableRow>
                  {[
                    "Tipo de asiento",
                    "Descripción",
                    "Asientos en flota",
                    "",
                  ].map((head) => (
                    <TableHead key={head}>{head}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSeatTypes ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="p-8 text-center text-muted-foreground"
                    >
                      Cargando tipos de asiento…
                    </TableCell>
                  </TableRow>
                ) : (
                  seatTypes.map((type, index) => (
                    <TableRow key={type.id}>
                      <TableCell className={`${tableCell} font-medium`}>
                        {type.nombre}
                      </TableCell>
                      <TableCell
                        className={`${tableCell} text-muted-foreground`}
                      >
                        {type.descripcion || "—"}
                      </TableCell>
                      <TableCell className={`${tableCell} font-mono`}>
                        {(seatCounts[index] ?? 0).toLocaleString("en-US")}
                      </TableCell>
                      <TableCell className={`${tableCell} text-right`}>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={`Editar ${type.nombre}`}
                          onClick={() => {
                            setSeatTypeForm({
                              id: type.id,
                              nombre: type.nombre,
                              descripcion: type.descripcion,
                            });
                            setPanel("tipos");
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <Sheet open={!!panel} onOpenChange={(open) => !open && setPanel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {panel &&
                `${panel === "aeronaves" ? (isNew(planeForm) ? "Nueva" : "Editar") : panel === "aerolineas" ? (isNew(airlineForm) ? "Nueva" : "Editar") : panel === "mantenimiento" ? (isNew(maintenanceForm) ? "Nuevo" : "Editar") : isNew(seatTypeForm) ? "Nuevo" : "Editar"} ${tabLabels[panel]}`}
            </SheetTitle>
            <SheetDescription>
              Gestiona los datos del catálogo seleccionado.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-6">
            {panel === "aeronaves" && (
              <>
                <Field label="Aerolínea">
                  <SelectField
                    options={airlineOptions}
                    value={planeForm.aerolineaId ?? null}
                    onChange={(value) =>
                      setPlaneForm({
                        ...planeForm,
                        aerolineaId: value ?? undefined,
                      })
                    }
                    placeholder="Seleccionar aerolínea…"
                  />
                </Field>
                <Field label="Matrícula">
                  <Input
                    value={planeForm.matricula ?? ""}
                    onChange={(event) =>
                      setPlaneForm({
                        ...planeForm,
                        matricula: event.target.value.toUpperCase(),
                      })
                    }
                    placeholder="N-AX600"
                    className="font-mono"
                  />
                </Field>
                <Field label="Nombre / modelo">
                  <Input
                    value={planeForm.nombre ?? ""}
                    onChange={(event) =>
                      setPlaneForm({ ...planeForm, nombre: event.target.value })
                    }
                    placeholder="Airbus A320neo"
                  />
                </Field>
                <Field label="Capacidad (asientos)">
                  <Input
                    type="number"
                    min={1}
                    value={planeForm.capacidad ?? ""}
                    onChange={(event) =>
                      setPlaneForm({
                        ...planeForm,
                        capacidad: Number(event.target.value),
                      })
                    }
                    className="font-mono"
                  />
                </Field>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Aeronave activa</div>
                    <div className="text-xs text-muted-foreground">
                      Las inactivas no aparecen al programar vuelos.
                    </div>
                  </div>
                  <Switch
                    checked={!!planeForm.activo}
                    onCheckedChange={(active) =>
                      setPlaneForm({ ...planeForm, activo: active })
                    }
                    aria-label="Aeronave activa"
                  />
                </div>
              </>
            )}
            {panel === "aerolineas" && (
              <>
                <Field label="Nombre">
                  <Input
                    value={airlineForm.nombre ?? ""}
                    onChange={(event) =>
                      setAirlineForm({
                        ...airlineForm,
                        nombre: event.target.value,
                      })
                    }
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="IATA" hint="2 letras">
                    <Input
                      maxLength={2}
                      value={airlineForm.codigoIata ?? ""}
                      onChange={(event) =>
                        setAirlineForm({
                          ...airlineForm,
                          codigoIata: event.target.value.toUpperCase(),
                        })
                      }
                      className="font-mono"
                    />
                  </Field>
                  <Field label="ICAO" hint="3 letras">
                    <Input
                      maxLength={3}
                      value={airlineForm.codigoIcao ?? ""}
                      onChange={(event) =>
                        setAirlineForm({
                          ...airlineForm,
                          codigoIcao: event.target.value.toUpperCase(),
                        })
                      }
                      className="font-mono"
                    />
                  </Field>
                </div>
                <Field
                  label="País"
                  hint="Los nombres de países pueden aparecer en inglés."
                >
                  <CountryField
                    value={airlineForm.pais ?? ""}
                    onChange={(value) =>
                      setAirlineForm({ ...airlineForm, pais: value })
                    }
                  />
                </Field>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Aerolínea activa</span>
                  <Switch
                    checked={!!airlineForm.activo}
                    onCheckedChange={(active) =>
                      setAirlineForm({ ...airlineForm, activo: active })
                    }
                    aria-label="Aerolínea activa"
                  />
                </div>
              </>
            )}
            {panel === "mantenimiento" && (
              <>
                <Field label="Aeronave">
                  <SelectField
                    options={planeOptions}
                    value={maintenanceForm.avion ?? null}
                    onChange={(value) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        avion: value ?? undefined,
                      })
                    }
                    placeholder="Seleccionar matrícula…"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tipo">
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={maintenanceForm.tipo ?? "PREVENTIVO"}
                      onChange={(event) =>
                        setMaintenanceForm({
                          ...maintenanceForm,
                          tipo: event.target.value as MantTipo,
                        })
                      }
                    >
                      {["PREVENTIVO", "CORRECTIVO", "INSPECCION"].map(
                        (type) => (
                          <option key={type}>{type}</option>
                        ),
                      )}
                    </select>
                  </Field>
                  <Field label="Estado">
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={maintenanceForm.estado ?? "PROGRAMADO"}
                      onChange={(event) =>
                        setMaintenanceForm({
                          ...maintenanceForm,
                          estado: event.target.value as MantEstado,
                        })
                      }
                    >
                      {["PROGRAMADO", "EN_CURSO", "COMPLETADO"].map((state) => (
                        <option key={state}>{state}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Descripción del trabajo">
                  <Input
                    value={maintenanceForm.descripcion ?? ""}
                    onChange={(event) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        descripcion: event.target.value,
                      })
                    }
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Inicio">
                    <Input
                      type="date"
                      value={maintenanceForm.inicio ?? ""}
                      onChange={(event) =>
                        setMaintenanceForm({
                          ...maintenanceForm,
                          inicio: event.target.value,
                        })
                      }
                      className="font-mono"
                    />
                  </Field>
                  <Field label="Fin estimado">
                    <Input
                      type="date"
                      value={maintenanceForm.fin ?? ""}
                      onChange={(event) =>
                        setMaintenanceForm({
                          ...maintenanceForm,
                          fin: event.target.value,
                        })
                      }
                      className="font-mono"
                    />
                  </Field>
                </div>
                <Field label="Responsable">
                  <SelectField
                    options={usuarios
                      .filter((user) => user.activo)
                      .map((user) => ({
                        value: user.id,
                        label: user.nombre,
                        sub: user.correo,
                      }))}
                    value={maintenanceForm.responsable ?? null}
                    onChange={(value) =>
                      setMaintenanceForm({
                        ...maintenanceForm,
                        responsable: value ?? undefined,
                      })
                    }
                    placeholder="Seleccionar responsable…"
                  />
                </Field>
              </>
            )}
            {panel === "tipos" && (
              <>
                <Field label="Nombre">
                  <Input
                    value={seatTypeForm.nombre ?? ""}
                    onChange={(event) =>
                      setSeatTypeForm({
                        ...seatTypeForm,
                        nombre: event.target.value,
                      })
                    }
                  />
                </Field>
                <Field label="Descripción">
                  <Input
                    value={seatTypeForm.descripcion ?? ""}
                    onChange={(event) =>
                      setSeatTypeForm({
                        ...seatTypeForm,
                        descripcion: event.target.value,
                      })
                    }
                  />
                </Field>
              </>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setPanel(null)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!valid}>
              Guardar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
