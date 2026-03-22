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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(n: any) {
  return parseFloat(String(n)).toLocaleString("es-AR", { minimumFractionDigits: 2 });
}
function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  CHEQUES:  "Cheques",
  MIXTO:    "Mixto",
};

const TABS = [
  { key: "ops",      label: "Órdenes de Pago" },
  { key: "facturas", label: "Facturas de Compra" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default async function OrdenesPagoPage({
  params,
  searchParams,
}: {
  params:       Promise<{ agencySlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { agencySlug } = await params;
  const { tab: tabParam } = await searchParams;
  const activeTab = (tabParam as TabKey) ?? "ops";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const [orders, purchaseInvoices] = await Promise.all([
    prisma.paymentOrder.findMany({
      where:   { agencyId: agency.id },
      include: { provider: { select: { fantasyName: true } } },
      orderBy: [{ date: "desc" }, { number: "desc" }],
      take:    300,
    }),
    prisma.purchaseInvoice.findMany({
      where:   { agencyId: agency.id },
      include: { provider: { select: { fantasyName: true } } },
      orderBy: [{ date: "desc" }],
      take:    300,
    }),
  ]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Órdenes de Pago</h1>
          <p className="text-muted-foreground text-sm">Pagos a prestadores y facturas de compra</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/${agencySlug}/ordenes-pago/facturas/nueva`} />}>
            <Plus className="h-4 w-4 mr-2" /> Factura de compra
          </Button>
          <Button render={<Link href={`/${agencySlug}/ordenes-pago/nueva`} />}>
            <Plus className="h-4 w-4 mr-2" /> Nueva OP
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/${agencySlug}/ordenes-pago?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} ({t.key === "ops" ? orders.length : purchaseInvoices.length})
          </Link>
        ))}
      </div>

        {/* ─── Tab OPs ─── */}
        {activeTab === "ops" && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32 font-mono">Número</TableHead>
                  <TableHead className="w-24 text-center">Fecha</TableHead>
                  <TableHead>Prestador</TableHead>
                  <TableHead className="w-20">Moneda</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                  <TableHead className="w-24">Forma</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No hay órdenes de pago.
                    </TableCell>
                  </TableRow>
                ) : orders.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      OP-{String(op.number).padStart(8, "0")}
                    </TableCell>
                    <TableCell className="text-center text-sm">{fmtDate(op.date)}</TableCell>
                    <TableCell className="text-sm">{op.provider.fantasyName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{op.currency}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {op.currency === "USD" ? "u$s" : "$"} {fmt(op.totalAmount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {METHOD_LABEL[op.paymentMethod]}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        render={<Link href={`/${agencySlug}/ordenes-pago/${op.id}`} />}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ─── Tab Facturas de Compra ─── */}
        {activeTab === "facturas" && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead className="w-24 text-center">Fecha</TableHead>
                  <TableHead>Prestador</TableHead>
                  <TableHead className="w-20">Moneda</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                  <TableHead className="w-32 text-right">Saldo</TableHead>
                  <TableHead className="w-24 text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No hay facturas de compra.{" "}
                      <Link href={`/${agencySlug}/ordenes-pago/facturas/nueva`} className="underline">
                        Ingresar la primera
                      </Link>
                    </TableCell>
                  </TableRow>
                ) : purchaseInvoices.map((inv) => {
                  const balance = parseFloat(String(inv.balance));
                  const symbol  = inv.currency === "USD" ? "u$s" : "$";
                  return (
                    <TableRow key={inv.id} className={inv.isVoided ? "opacity-50" : undefined}>
                      <TableCell className="font-mono text-sm">{inv.number}</TableCell>
                      <TableCell className="text-center text-sm">{fmtDate(inv.date)}</TableCell>
                      <TableCell className="text-sm">{inv.provider?.fantasyName ?? inv.providerName ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{inv.currency}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{symbol} {fmt(inv.total)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-amber-600">{symbol} {fmt(inv.balance)}</TableCell>
                      <TableCell className="text-center">
                        {inv.isVoided ? (
                          <Badge variant="destructive" className="text-xs">Anulada</Badge>
                        ) : balance <= 0.01 ? (
                          <Badge variant="secondary" className="text-xs">Pagada</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Pendiente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
    </div>
  );
}
