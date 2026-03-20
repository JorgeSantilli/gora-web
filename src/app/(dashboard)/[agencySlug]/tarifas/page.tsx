import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";

const SERVICE_LABELS: Record<string, string> = {
  HOTEL: "Hotel", MEAL: "Comidas", EXCURSION: "Excursiones",
  TRANSFER: "Traslados", TICKET: "Tickets", RENTAL: "Rentas", MISC: "Varios",
};

const MEDIUM_LABELS: Record<string, string> = {
  SIN_TRANSPORTE: "Sin transporte", CON_BUS: "Con bus", CON_AEREO: "Con aéreo",
};

const TABS = [
  { key: "costos",    label: "Costos" },
  { key: "ventas",    label: "Tarifas de Venta" },
  { key: "programas", label: "Tarifas de Programa" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function TarifasPage({
  params,
  searchParams,
}: {
  params: Promise<{ agencySlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { agencySlug } = await params;
  const { tab } = await searchParams;
  const activeTab: TabKey = (TABS.find((t) => t.key === tab)?.key) ?? "costos";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const fmt = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";

  // Load data based on active tab
  const [costs, tariffs, programTariffs] = await Promise.all([
    activeTab === "costos" ? prisma.cost.findMany({
      where: { agencyId: agency.id },
      include: { provider: { select: { fantasyName: true } } },
      orderBy: { validFrom: "desc" },
      take: 200,
    }) : Promise.resolve([]),
    activeTab === "ventas" ? prisma.tariff.findMany({
      where: { agencyId: agency.id },
      include: { provider: { select: { fantasyName: true } } },
      orderBy: { validFrom: "desc" },
      take: 200,
    }) : Promise.resolve([]),
    activeTab === "programas" ? prisma.programTariff.findMany({
      where: { agencyId: agency.id },
      include: { program: { select: { code: true, name: true } } },
      orderBy: { validFrom: "desc" },
      take: 200,
    }) : Promise.resolve([]),
  ]);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tarifas y Costos</h1>
          <p className="text-muted-foreground text-sm">Gestión de costos y tarifas por prestador y programa</p>
        </div>
        {activeTab === "costos" && (
          <Button render={<Link href={`/${agencySlug}/tarifas/costos/nuevo`} />}>
            <Plus className="h-4 w-4 mr-2" />Nuevo Costo
          </Button>
        )}
        {activeTab === "ventas" && (
          <Button render={<Link href={`/${agencySlug}/tarifas/ventas/nuevo`} />}>
            <Plus className="h-4 w-4 mr-2" />Nueva Tarifa de Venta
          </Button>
        )}
        {activeTab === "programas" && (
          <Button render={<Link href={`/${agencySlug}/tarifas/programas/nuevo`} />}>
            <Plus className="h-4 w-4 mr-2" />Nueva Tarifa de Programa
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/${agencySlug}/tarifas?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Costos */}
      {activeTab === "costos" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestador</TableHead>
                <TableHead className="w-28">Servicio</TableHead>
                <TableHead className="w-24 text-center">Desde</TableHead>
                <TableHead className="w-24 text-center">Hasta</TableHead>
                <TableHead className="w-20">Moneda</TableHead>
                <TableHead className="w-16 text-center">Filas</TableHead>
                <TableHead className="w-16 text-center">Acc.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No hay costos registrados.{" "}
                    <Link href={`/${agencySlug}/tarifas/costos/nuevo`} className="underline">Crear el primero</Link>
                  </TableCell>
                </TableRow>
              ) : costs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-sm">{c.provider.fantasyName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{SERVICE_LABELS[c.serviceType] ?? c.serviceType}</Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">{fmt(c.validFrom)}</TableCell>
                  <TableCell className="text-center text-sm">{fmt(c.validTo)}</TableCell>
                  <TableCell className="text-sm">{c.currency === "USD" ? "u$s" : "$"}</TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {Array.isArray(c.details) ? c.details.length : 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/tarifas/costos/${c.id}`} />}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tarifas de Venta */}
      {activeTab === "ventas" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestador</TableHead>
                <TableHead className="w-28">Servicio</TableHead>
                <TableHead className="w-24 text-center">Desde</TableHead>
                <TableHead className="w-24 text-center">Hasta</TableHead>
                <TableHead className="w-20">Moneda</TableHead>
                <TableHead className="w-16 text-center">Filas</TableHead>
                <TableHead className="w-16 text-center">Acc.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tariffs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No hay tarifas de venta.{" "}
                    <Link href={`/${agencySlug}/tarifas/ventas/nuevo`} className="underline">Crear la primera</Link>
                  </TableCell>
                </TableRow>
              ) : tariffs.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-sm">{t.provider.fantasyName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{SERVICE_LABELS[t.serviceType] ?? t.serviceType}</Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">{fmt(t.validFrom)}</TableCell>
                  <TableCell className="text-center text-sm">{fmt(t.validTo)}</TableCell>
                  <TableCell className="text-sm">{t.currency === "USD" ? "u$s" : "$"}</TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {Array.isArray(t.details) ? t.details.length : 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/tarifas/ventas/${t.id}`} />}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Tarifas de Programa */}
      {activeTab === "programas" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Programa</TableHead>
                <TableHead className="w-32">Medio</TableHead>
                <TableHead className="w-24 text-center">Desde</TableHead>
                <TableHead className="w-24 text-center">Hasta</TableHead>
                <TableHead className="w-20">Moneda</TableHead>
                <TableHead className="w-16 text-center">Filas</TableHead>
                <TableHead className="w-16 text-center">Acc.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programTariffs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No hay tarifas de programa.{" "}
                    <Link href={`/${agencySlug}/tarifas/programas/nuevo`} className="underline">Crear la primera</Link>
                  </TableCell>
                </TableRow>
              ) : programTariffs.map((pt) => (
                <TableRow key={pt.id}>
                  <TableCell className="font-medium text-sm">
                    <span className="font-mono text-xs mr-1">{pt.program.code}</span>
                    {pt.program.name}
                  </TableCell>
                  <TableCell className="text-sm">{MEDIUM_LABELS[pt.medium] ?? pt.medium}</TableCell>
                  <TableCell className="text-center text-sm">{fmt(pt.validFrom)}</TableCell>
                  <TableCell className="text-center text-sm">{fmt(pt.validTo)}</TableCell>
                  <TableCell className="text-sm">{pt.currency === "USD" ? "u$s" : "$"}</TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {Array.isArray(pt.details) ? pt.details.length : 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/tarifas/programas/${pt.id}`} />}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
