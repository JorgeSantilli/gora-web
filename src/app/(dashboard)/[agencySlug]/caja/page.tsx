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
import { CreateCajaButton } from "./create-caja-button";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pendiente", variant: "outline" },
  OPEN:    { label: "Abierta",   variant: "default" },
  CLOSED:  { label: "Cerrada",   variant: "secondary" },
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(n: any) {
  return parseFloat(String(n)).toLocaleString("es-AR", { minimumFractionDigits: 2 });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CajaPage({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}) {
  const { agencySlug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const cashes = await prisma.dailyCash.findMany({
    where:   { agencyId: agency.id },
    orderBy: [{ date: "desc" }, { currency: "asc" }],
    take:    90,
  });

  // Cajas pendientes (más antiguas primero) — requieren atención
  const pendingOldest = cashes
    .filter((c) => c.status === "PENDING")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cajas Diarias</h1>
          <p className="text-muted-foreground text-sm">
            Movimientos de caja por día y moneda
          </p>
        </div>
        <CreateCajaButton agencyId={agency.id} agencySlug={agencySlug} />
      </div>

      {/* Alerta cajas pendientes */}
      {pendingOldest.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm space-y-1">
          <p className="font-medium text-amber-800 dark:text-amber-300">
            {pendingOldest.length === 1
              ? "Hay 1 caja pendiente de apertura:"
              : `Hay ${pendingOldest.length} cajas pendientes de apertura:`}
          </p>
          <p className="text-amber-700 dark:text-amber-400 text-xs">
            El sistema requiere abrir las cajas en orden cronológico (la más antigua primero).
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {pendingOldest.map((c) => (
              <Link
                key={c.id}
                href={`/${agencySlug}/caja/${c.id}`}
                className="underline font-medium"
              >
                {fmtDate(c.date)} ({c.currency})
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-20">Moneda</TableHead>
              <TableHead className="w-24 text-center">Estado</TableHead>
              <TableHead className="w-32 text-right">Ingresos</TableHead>
              <TableHead className="w-32 text-right">Egresos</TableHead>
              <TableHead className="w-32 text-right">Saldo</TableHead>
              <TableHead className="w-12 text-center">Ver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No hay cajas registradas.
                </TableCell>
              </TableRow>
            ) : cashes.map((c) => {
              const { label, variant } = STATUS_BADGE[c.status] ?? STATUS_BADGE.PENDING;
              const symbol = c.currency === "USD" ? "u$s" : "$";
              const saldo = parseFloat(String(c.totalIn)) - parseFloat(String(c.totalOut));
              return (
                <TableRow
                  key={c.id}
                  className={c.status === "PENDING" ? "bg-amber-50/50 dark:bg-amber-950/10" : undefined}
                >
                  <TableCell className="text-center text-sm font-mono">{c.number}</TableCell>
                  <TableCell className="text-sm capitalize">{fmtDate(c.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{c.currency}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={variant} className="text-xs">{label}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-green-700 dark:text-green-400">
                    {symbol} {fmt(c.totalIn)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-700 dark:text-red-400">
                    {symbol} {fmt(c.totalOut)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    {symbol} {fmt(saldo)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="icon" variant="ghost" className="h-8 w-8"
                      render={<Link href={`/${agencySlug}/caja/${c.id}`} />}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
