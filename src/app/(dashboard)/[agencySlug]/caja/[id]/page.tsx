import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import { CajaActions } from "./caja-actions";
import { AddTransactionForm } from "./add-transaction-form";
import { DeleteTransactionButton } from "./delete-transaction-button";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(n: any) {
  return parseFloat(String(n)).toLocaleString("es-AR", { minimumFractionDigits: 2 });
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pendiente",  variant: "outline" },
  OPEN:    { label: "Abierta",    variant: "default" },
  CLOSED:  { label: "Cerrada",    variant: "secondary" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CajaDetailPage({
  params,
}: {
  params: Promise<{ agencySlug: string; id: string }>;
}) {
  const { agencySlug, id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const dbUser = await prisma.user.findFirst({ where: { supabaseId: user.id } });

  const cash = await prisma.dailyCash.findUnique({
    where:   { id, agencyId: agency.id },
    include: {
      transactions: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!cash) redirect(`/${agencySlug}/caja`);

  const symbol = cash.currency === "USD" ? "u$s" : "$";
  const saldo  = parseFloat(String(cash.totalIn)) - parseFloat(String(cash.totalOut));
  const inTxs  = cash.transactions.filter((t) => t.direction === "IN");
  const outTxs = cash.transactions.filter((t) => t.direction === "OUT");
  const { label, variant } = STATUS_BADGE[cash.status] ?? STATUS_BADGE.PENDING;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8"
          render={<Link href={`/${agencySlug}/caja`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold capitalize">{fmtDate(cash.date)}</h1>
            <Badge variant="outline">{cash.currency}</Badge>
            <Badge variant={variant}>{label}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Caja N° {cash.number}
            {cash.status === "CLOSED" && cash.closedAt && (
              <> · Cerrada el {fmtDateTime(cash.closedAt)}{cash.closedBy ? ` por ${cash.closedBy}` : ""}</>
            )}
          </p>
        </div>
        <CajaActions
          cash={{ id: cash.id, status: cash.status }}
          agencyId={agency.id}
          agencySlug={agencySlug}
          userName={dbUser?.name ?? user.email ?? ""}
        />
      </div>

      {/* Totales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Total Ingresos</span>
          </div>
          <p className="text-2xl font-bold font-mono">
            {symbol} {fmt(cash.totalIn)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-1">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm font-medium">Total Egresos</span>
          </div>
          <p className="text-2xl font-bold font-mono">
            {symbol} {fmt(cash.totalOut)}
          </p>
        </div>
        <div className="rounded-lg border p-4 bg-muted/30">
          <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Neto</p>
          <p className={`text-2xl font-bold font-mono ${saldo >= 0 ? "" : "text-red-600"}`}>
            {symbol} {fmt(saldo)}
          </p>
        </div>
      </div>

      {/* Formulario agregar (solo OPEN) */}
      {cash.status === "OPEN" && (
        <AddTransactionForm
          dailyCashId={cash.id}
          agencyId={agency.id}
          agencySlug={agencySlug}
          currency={cash.currency}
        />
      )}

      {/* Movimientos */}
      <div className="space-y-4">
        {/* Ingresos */}
        <div>
          <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" /> Ingresos
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origen</TableHead>
                  <TableHead>Tipo / Número</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Imputación</TableHead>
                  <TableHead className="text-right w-36">Importe</TableHead>
                  {cash.status === "OPEN" && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {inTxs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={cash.status === "OPEN" ? 6 : 5}
                      className="text-center py-6 text-muted-foreground text-sm">
                      Sin ingresos registrados.
                    </TableCell>
                  </TableRow>
                ) : inTxs.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{tx.origin}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {tx.voucherType}{tx.voucherNumber ? ` — ${tx.voucherNumber}` : ""}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.description ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.accountEntry ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-green-700 dark:text-green-400">
                      {symbol} {fmt(tx.amount)}
                    </TableCell>
                    {cash.status === "OPEN" && (
                      <TableCell>
                        <DeleteTransactionButton
                          transactionId={tx.id}
                          dailyCashId={cash.id}
                          agencyId={agency.id}
                          agencySlug={agencySlug}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Egresos */}
        <div>
          <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" /> Egresos
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origen</TableHead>
                  <TableHead>Tipo / Número</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Imputación</TableHead>
                  <TableHead className="text-right w-36">Importe</TableHead>
                  {cash.status === "OPEN" && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {outTxs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={cash.status === "OPEN" ? 6 : 5}
                      className="text-center py-6 text-muted-foreground text-sm">
                      Sin egresos registrados.
                    </TableCell>
                  </TableRow>
                ) : outTxs.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{tx.origin}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {tx.voucherType}{tx.voucherNumber ? ` — ${tx.voucherNumber}` : ""}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.description ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.accountEntry ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-700 dark:text-red-400">
                      {symbol} {fmt(tx.amount)}
                    </TableCell>
                    {cash.status === "OPEN" && (
                      <TableCell>
                        <DeleteTransactionButton
                          transactionId={tx.id}
                          dailyCashId={cash.id}
                          agencyId={agency.id}
                          agencySlug={agencySlug}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
