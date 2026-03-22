import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, AlertTriangle, CheckCircle2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TRANSFER_LABEL: Record<string, string> = {
  ENTRADA:   "Entrada",
  SALIDA:    "Salida",
  CENA_SHOW: "Cena/Show",
  CONEXION:  "Conexión",
  ASISTENCIA: "Asistencia",
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** días hasta vencimiento */
function daysUntil(d: Date) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

function ExpiryBadge({ days }: { days: number }) {
  if (days < 0) return <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Vencido</Badge>;
  if (days <= 30) return <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 gap-1"><AlertTriangle className="h-3 w-3" />{days}d</Badge>;
  return <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3" />{days}d</Badge>;
}

const TABS = [
  { key: "traslados",  label: "Traslados" },
  { key: "excursiones", label: "Excursiones" },
  { key: "vehiculos",  label: "Vehículos" },
  { key: "choferes",   label: "Choferes" },
  { key: "guias",      label: "Guías" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReceptivoPage({
  params,
  searchParams,
}: {
  params:       Promise<{ agencySlug: string }>;
  searchParams: Promise<{ tab?: string; fecha?: string }>;
}) {
  const { agencySlug } = await params;
  const sp = await searchParams;
  const activeTab = (sp.tab as TabKey) ?? "traslados";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  // ── Data por tab ─────────────────────────────────────────────────────────────

  const [traslados, excursiones, vehicles, drivers, guides] = await Promise.all([
    activeTab === "traslados"
      ? prisma.dailyTransfer.findMany({
          where:   { agencyId: agency.id },
          orderBy: { date: "desc" },
          take: 100,
        })
      : Promise.resolve([]),

    activeTab === "excursiones"
      ? prisma.dailyExcursion.findMany({
          where:   { agencyId: agency.id },
          orderBy: { date: "desc" },
          include: { vehicles: { include: { vehicle: { select: { description: true } }, transportCompany: { select: { name: true } } } } },
          take: 100,
        })
      : Promise.resolve([]),

    activeTab === "vehiculos"
      ? prisma.vehicle.findMany({
          where:   { agencyId: agency.id },
          orderBy: { code: "asc" },
          include: { expiries: { orderBy: { expiresAt: "asc" } } },
        })
      : Promise.resolve([]),

    activeTab === "choferes"
      ? prisma.driver.findMany({
          where:   { agencyId: agency.id },
          orderBy: { code: "asc" },
          include: { expiries: { orderBy: { expiresAt: "asc" } } },
        })
      : Promise.resolve([]),

    activeTab === "guias"
      ? prisma.guide.findMany({
          where:   { agencyId: agency.id },
          orderBy: { code: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Receptivo</h1>
          <p className="text-muted-foreground text-sm">Flota, choferes, guías y operaciones diarias</p>
        </div>
        {activeTab === "traslados" && (
          <Button render={<Link href={`/${agencySlug}/receptivo/traslados/nuevo`} />}>
            <Plus className="h-4 w-4 mr-1" />Nuevo traslado
          </Button>
        )}
        {activeTab === "excursiones" && (
          <Button render={<Link href={`/${agencySlug}/receptivo/excursiones/nuevo`} />}>
            <Plus className="h-4 w-4 mr-1" />Nueva excursión
          </Button>
        )}
        {activeTab === "vehiculos" && (
          <Button render={<Link href={`/${agencySlug}/receptivo/vehiculos/nuevo`} />}>
            <Plus className="h-4 w-4 mr-1" />Nuevo vehículo
          </Button>
        )}
        {activeTab === "choferes" && (
          <Button render={<Link href={`/${agencySlug}/receptivo/choferes/nuevo`} />}>
            <Plus className="h-4 w-4 mr-1" />Nuevo chofer
          </Button>
        )}
        {activeTab === "guias" && (
          <Button render={<Link href={`/${agencySlug}/receptivo/guias/nuevo`} />}>
            <Plus className="h-4 w-4 mr-1" />Nuevo guía
          </Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/${agencySlug}/receptivo?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ─── TRASLADOS ──────────────────────────────────────────────────────────── */}
      {activeTab === "traslados" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {traslados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                    Sin traslados registrados.
                  </TableCell>
                </TableRow>
              ) : traslados.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{fmtDate(t.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{TRANSFER_LABEL[t.type] ?? t.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/${agencySlug}/receptivo/traslados/${t.id}`} className="text-xs text-muted-foreground hover:text-foreground underline">
                      Ver
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── EXCURSIONES ────────────────────────────────────────────────────────── */}
      {activeTab === "excursiones" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Fecha</TableHead>
                <TableHead className="w-20">Horario</TableHead>
                <TableHead>Excursión</TableHead>
                <TableHead className="w-24 text-center">Vehículos</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {excursiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Sin excursiones registradas.
                  </TableCell>
                </TableRow>
              ) : excursiones.map((exc) => (
                <TableRow key={exc.id}>
                  <TableCell className="text-sm">{fmtDate(exc.date)}</TableCell>
                  <TableCell className="text-sm font-mono">{exc.time ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {exc.excursionCodeId ? `Excursión ${exc.excursionCodeId}` : "Sin código"}
                    {exc.comments && <span className="text-muted-foreground ml-2 text-xs">{exc.comments}</span>}
                  </TableCell>
                  <TableCell className="text-center text-sm">{exc.vehicles.length}</TableCell>
                  <TableCell>
                    <Link href={`/${agencySlug}/receptivo/excursiones/${exc.id}`} className="text-xs text-muted-foreground hover:text-foreground underline">
                      Ver
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── VEHÍCULOS ──────────────────────────────────────────────────────────── */}
      {activeTab === "vehiculos" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Cód.</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-28">Dominio</TableHead>
                <TableHead className="w-16 text-center">Asientos</TableHead>
                <TableHead className="w-20 text-center">Tipo</TableHead>
                <TableHead className="w-24 text-center">Próx. venc.</TableHead>
                <TableHead className="w-20 text-center">Estado</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Sin vehículos registrados.
                  </TableCell>
                </TableRow>
              ) : vehicles.map((v) => {
                const nextExpiry = v.expiries.length > 0 ? v.expiries[0] : null;
                const expiryDays = nextExpiry ? daysUntil(nextExpiry.expiresAt) : null;
                return (
                  <TableRow key={v.id}>
                    <TableCell className="text-center text-sm font-mono">{v.code}</TableCell>
                    <TableCell className="font-medium text-sm">{v.description}</TableCell>
                    <TableCell className="font-mono text-sm">{v.plate ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">{v.seats ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={v.isOwn ? "secondary" : "outline"} className="text-xs">
                        {v.isOwn ? "Propio" : "3°"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {nextExpiry ? (
                        <span>{nextExpiry.concept}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {expiryDays !== null ? <ExpiryBadge days={expiryDays} /> : <Badge variant="secondary" className="text-xs">Sin venc.</Badge>}
                    </TableCell>
                    <TableCell>
                      <Link href={`/${agencySlug}/receptivo/vehiculos/${v.id}`} className="text-xs text-muted-foreground hover:text-foreground underline">
                        Ver
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── CHOFERES ───────────────────────────────────────────────────────────── */}
      {activeTab === "choferes" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Cód.</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-28">Teléfono</TableHead>
                <TableHead className="w-20 text-center">Tipo</TableHead>
                <TableHead className="w-24 text-center">Próx. venc.</TableHead>
                <TableHead className="w-20 text-center">Estado</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Sin choferes registrados.
                  </TableCell>
                </TableRow>
              ) : drivers.map((d) => {
                const nextExpiry = d.expiries.length > 0 ? d.expiries[0] : null;
                const expiryDays = nextExpiry ? daysUntil(nextExpiry.expiresAt) : null;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="text-center text-sm font-mono">{d.code}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {d.name}
                      {!d.active && <Badge variant="outline" className="ml-2 text-xs">Inactivo</Badge>}
                    </TableCell>
                    <TableCell className="text-sm">{d.phone ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={d.isOwn ? "secondary" : "outline"} className="text-xs">
                        {d.isOwn ? "Propio" : "3°"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {nextExpiry ? nextExpiry.concept : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {expiryDays !== null ? <ExpiryBadge days={expiryDays} /> : <Badge variant="secondary" className="text-xs">Sin venc.</Badge>}
                    </TableCell>
                    <TableCell>
                      <Link href={`/${agencySlug}/receptivo/choferes/${d.id}`} className="text-xs text-muted-foreground hover:text-foreground underline">
                        Ver
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── GUÍAS ──────────────────────────────────────────────────────────────── */}
      {activeTab === "guias" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Cód.</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-28">Teléfono</TableHead>
                <TableHead>Idiomas</TableHead>
                <TableHead className="w-20 text-center">Estado</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {guides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Sin guías registrados.
                  </TableCell>
                </TableRow>
              ) : guides.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="text-center text-sm font-mono">{g.code}</TableCell>
                  <TableCell className="font-medium text-sm">{g.name}</TableCell>
                  <TableCell className="text-sm">{g.phone ?? "—"}</TableCell>
                  <TableCell className="text-sm">{g.languages.join(", ") || "—"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={g.active ? "secondary" : "outline"} className="text-xs">
                      {g.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/${agencySlug}/receptivo/guias/${g.id}`} className="text-xs text-muted-foreground hover:text-foreground underline">
                      Ver
                    </Link>
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
