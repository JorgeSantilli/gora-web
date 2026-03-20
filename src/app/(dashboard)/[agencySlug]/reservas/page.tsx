import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Eye } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  TENTATIVE:       { label: "Tentativa",      variant: "secondary" },
  CONFIRMED:       { label: "Confirmada",     variant: "default" },
  CANCELLED:       { label: "Cancelada",      variant: "destructive" },
  INVOICED:        { label: "Facturada",      variant: "outline" },
  VOUCHERS_ISSUED: { label: "Vouchers emit.", variant: "outline" },
};

export default async function ReservasPage({
  params,
  searchParams,
}: {
  params: Promise<{ agencySlug: string }>;
  searchParams: Promise<{ q?: string; estado?: string; origen?: string }>;
}) {
  const { agencySlug } = await params;
  const { q, estado, origen } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const [reservations, origins] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        agencyId: agency.id,
        ...(estado && { status: estado as never }),
        ...(origen && { origin: origen }),
        ...(q && {
          OR: [
            { leadPax: { contains: q, mode: "insensitive" } },
            { number: { contains: q } },
            { client: { fantasyName: { contains: q, mode: "insensitive" } } },
          ],
        }),
      },
      include: {
        client: { select: { fantasyName: true } },
        program: { select: { name: true } },
        _count: {
          select: {
            passengers: true,
            accommodations: true,
            excursions: true,
            transfers: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 200,
    }),
    prisma.reservationOrigin.findMany({
      where: { agencyId: agency.id },
      orderBy: { letter: "asc" },
    }),
  ]);

  const fmt = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reservas</h1>
          <p className="text-muted-foreground text-sm">
            {reservations.length} registro{reservations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href={`/${agencySlug}/reservas/nueva`} />}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Reserva
        </Button>
      </div>

      {/* Filtros */}
      <form className="flex gap-2 flex-wrap" method="GET">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Titular, N° reserva, cliente..."
          className="max-w-xs"
        />
        <select
          name="origen"
          defaultValue={origen ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos los orígenes</option>
          {origins.map((o) => (
            <option key={o.id} value={o.letter}>
              {o.letter} — {o.label}
            </option>
          ))}
        </select>
        <select
          name="estado"
          defaultValue={estado ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="TENTATIVE">Tentativas</option>
          <option value="CONFIRMED">Confirmadas</option>
          <option value="CANCELLED">Canceladas</option>
          <option value="INVOICED">Facturadas</option>
          <option value="VOUCHERS_ISSUED">Vouchers emitidos</option>
        </select>
        <Button type="submit" variant="outline" size="sm">Filtrar</Button>
        <Button variant="ghost" size="sm" render={<Link href={`/${agencySlug}/reservas`} />}>
          Limpiar
        </Button>
      </form>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Reserva</TableHead>
              <TableHead>Titular / Pax</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead className="w-24 text-center">Check-in</TableHead>
              <TableHead className="w-24 text-center">Check-out</TableHead>
              <TableHead className="w-28">Estado</TableHead>
              <TableHead className="w-16 text-center">Acc.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No hay reservas.{" "}
                  <Link href={`/${agencySlug}/reservas/nueva`} className="underline">
                    Crear la primera
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              reservations.map((r) => {
                const st = STATUS_LABELS[r.status] ?? { label: r.status, variant: "secondary" as const };
                const isCancelled = r.status === "CANCELLED";
                return (
                  <TableRow key={r.id} className={isCancelled ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="font-mono font-semibold text-sm">
                        {r.origin}{r.number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{r.leadPax}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.adults}A{r.minors > 0 ? ` ${r.minors}M` : ""}{r.free > 0 ? ` ${r.free}G` : ""}
                        {r._count.accommodations > 0 && ` · ${r._count.accommodations} hotel`}
                        {r._count.excursions > 0 && ` · ${r._count.excursions} exc.`}
                        {r._count.transfers > 0 && ` · ${r._count.transfers} trasl.`}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.client?.fantasyName ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.program?.name ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">{fmt(r.checkIn)}</TableCell>
                    <TableCell className="text-center text-sm">{fmt(r.checkOut)}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="icon" variant="ghost" className="h-8 w-8"
                        render={<Link href={`/${agencySlug}/reservas/${r.id}`} />}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
