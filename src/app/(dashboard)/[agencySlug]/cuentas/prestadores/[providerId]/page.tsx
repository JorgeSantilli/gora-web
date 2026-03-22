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

export default async function ProviderCtaCtePage({
  params,
  searchParams,
}: {
  params:       Promise<{ agencySlug: string; providerId: string }>;
  searchParams: Promise<{ currency?: string }>;
}) {
  const { agencySlug, providerId } = await params;
  const { currency: currencyParam } = await searchParams;
  const activeCurrency = currencyParam ?? "PESOS";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const provider = await prisma.provider.findUnique({
    where:  { id: providerId, agencyId: agency.id },
    select: { id: true, fantasyName: true, legalName: true, code: true },
  });
  if (!provider) redirect(`/${agencySlug}/cuentas?tab=prestadores`);

  // Monedas disponibles
  const availableCurrencies = await prisma.providerAccountMovement.findMany({
    where:    { agencyId: agency.id, providerId },
    distinct: ["currency"],
    select:   { currency: true },
    orderBy:  { currency: "asc" },
  });
  const currencies = availableCurrencies.map((c) => c.currency);

  // Movimientos en la moneda activa
  const movements = await prisma.providerAccountMovement.findMany({
    where:   { agencyId: agency.id, providerId, currency: activeCurrency as "PESOS" | "USD" },
    orderBy: { createdAt: "asc" },
  });

  const currentBalance = movements.length > 0
    ? parseFloat(String(movements[movements.length - 1].balance))
    : 0;

  const symbol = activeCurrency === "USD" ? "u$s" : "$";

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button size="icon" variant="ghost" className="h-8 w-8"
          render={<Link href={`/${agencySlug}/cuentas?tab=prestadores`} />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{provider.fantasyName}</h1>
          <p className="text-muted-foreground text-sm">
            Cód. {provider.code}{provider.legalName ? ` · ${provider.legalName}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Saldo actual ({activeCurrency})</p>
          <p className={`text-2xl font-bold font-mono ${
            currentBalance > 0 ? "text-amber-600" : currentBalance < 0 ? "text-green-600" : ""
          }`}>
            {symbol} {fmt(currentBalance)}
          </p>
          {currentBalance > 0 && <p className="text-xs text-amber-600">Deuda pendiente</p>}
          {currentBalance < 0 && <p className="text-xs text-green-600">A favor del prestador</p>}
          {currentBalance === 0 && <p className="text-xs text-muted-foreground">Al día</p>}
        </div>
      </div>

      {/* Selector de moneda */}
      {currencies.length > 1 && (
        <div className="flex gap-1 border-b">
          {currencies.map((cur) => (
            <Link
              key={cur}
              href={`/${agencySlug}/cuentas/prestadores/${providerId}?currency=${cur}`}
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

      {/* Movimientos */}
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
                    <span className="text-amber-600">{symbol} {fmt(mov.debit)}</span>
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
