import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(n: any) {
  return parseFloat(String(n)).toLocaleString("es-AR", { minimumFractionDigits: 2 });
}
function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function ClienteCtaCtePage({
  params,
  searchParams,
}: {
  params:       Promise<{ agencySlug: string; clientId: string }>;
  searchParams: Promise<{ currency?: string }>;
}) {
  const { agencySlug, clientId } = await params;
  const { currency: currencyParam } = await searchParams;
  const activeCurrency = currencyParam ?? "PESOS";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const client = await prisma.client.findUnique({
    where:  { id: clientId, agencyId: agency.id },
    select: { id: true, fantasyName: true, legalName: true, code: true },
  });
  if (!client) redirect(`/${agencySlug}/cuentas`);

  // Monedas disponibles para este cliente
  const availableCurrencies = await prisma.clientAccountMovement.findMany({
    where:    { agencyId: agency.id, clientId },
    distinct: ["currency"],
    select:   { currency: true },
    orderBy:  { currency: "asc" },
  });
  const currencies = availableCurrencies.map((c) => c.currency);

  // Movimientos del cliente en la moneda activa
  const movements = await prisma.clientAccountMovement.findMany({
    where:   { agencyId: agency.id, clientId, currency: activeCurrency as "PESOS" | "USD" },
    orderBy: { createdAt: "asc" },
  });

  // Saldo actual (último movimiento)
  const currentBalance = movements.length > 0
    ? parseFloat(String(movements[movements.length - 1].balance))
    : 0;

  const symbol = activeCurrency === "USD" ? "u$s" : "$";

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8"
          render={<Link href={`/${agencySlug}/cuentas?tab=clientes`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{client.fantasyName}</h1>
          <p className="text-muted-foreground text-sm">
            Cód. {client.code}{client.legalName ? ` · ${client.legalName}` : ""}
          </p>
        </div>
        <div className={`text-right`}>
          <p className="text-xs text-muted-foreground">Saldo actual ({activeCurrency})</p>
          <p className={`text-2xl font-bold font-mono ${
            currentBalance > 0 ? "text-red-600" : currentBalance < 0 ? "text-green-600" : ""
          }`}>
            {symbol} {fmt(currentBalance)}
          </p>
          {currentBalance > 0 && <p className="text-xs text-red-500">Debe</p>}
          {currentBalance < 0 && <p className="text-xs text-green-600">A favor</p>}
          {currentBalance === 0 && <p className="text-xs text-muted-foreground">Al día</p>}
        </div>
      </div>

      {/* Selector de moneda */}
      {currencies.length > 1 && (
        <div className="flex gap-1 border-b">
          {currencies.map((cur) => (
            <Link
              key={cur}
              href={`/${agencySlug}/cuentas/clientes/${clientId}?currency=${cur}`}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeCurrency === cur
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {cur}
            </Link>
          ))}
        </div>
      )}

      {/* Tabla de movimientos */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 text-center">Fecha</TableHead>
              <TableHead className="w-20 text-center">Tipo</TableHead>
              <TableHead>Comprobante</TableHead>
              <TableHead className="w-28 text-right">Debe</TableHead>
              <TableHead className="w-28 text-right">Haber</TableHead>
              <TableHead className="w-32 text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Sin movimientos en {activeCurrency}.
                </TableCell>
              </TableRow>
            ) : movements.map((mov) => (
              <TableRow key={mov.id}>
                <TableCell className="text-center text-sm">{fmtDate(mov.date)}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={mov.type === "DEBIT" ? "outline" : "secondary"}
                    className="text-xs"
                  >
                    {mov.type === "DEBIT" ? "Débito" : "Crédito"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium">{mov.voucherType}</span>
                  {mov.voucherNumber && (
                    <span className="text-muted-foreground ml-2 font-mono text-xs">{mov.voucherNumber}</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {parseFloat(String(mov.debit)) > 0 ? (
                    <span className="text-red-600">{symbol} {fmt(mov.debit)}</span>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {parseFloat(String(mov.credit)) > 0 ? (
                    <span className="text-green-600">{symbol} {fmt(mov.credit)}</span>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
                  {symbol} {fmt(mov.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
