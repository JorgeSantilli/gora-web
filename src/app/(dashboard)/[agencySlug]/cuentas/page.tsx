import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(n: any) {
  return parseFloat(String(n)).toLocaleString("es-AR", { minimumFractionDigits: 2 });
}

const TABS = [
  { key: "clientes",   label: "Clientes" },
  { key: "prestadores", label: "Prestadores" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default async function CuentasPage({
  params,
  searchParams,
}: {
  params:       Promise<{ agencySlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { agencySlug } = await params;
  const { tab: tabParam } = await searchParams;
  const activeTab = (tabParam as TabKey) ?? "clientes";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  // Último movimiento por (clientId, currency) — da el saldo actual
  const clientBalances = await prisma.clientAccountMovement.findMany({
    where:    { agencyId: agency.id },
    orderBy:  { createdAt: "desc" },
    distinct: ["clientId", "currency"],
    select: {
      clientId: true,
      currency: true,
      balance:  true,
      client:   { select: { id: true, fantasyName: true, code: true } },
    },
  });

  // Último movimiento por (providerId, currency)
  const providerBalances = await prisma.providerAccountMovement.findMany({
    where:    { agencyId: agency.id },
    orderBy:  { createdAt: "desc" },
    distinct: ["providerId", "currency"],
    select: {
      providerId: true,
      currency:   true,
      balance:    true,
      provider:   { select: { id: true, fantasyName: true, code: true } },
    },
  });

  // Agrupar por entidad para mostrar saldos multi-moneda en una sola fila
  const clientMap = new Map<string, {
    client:   { id: string; fantasyName: string; code: number };
    balances: { currency: string; balance: number }[];
  }>();
  for (const mov of clientBalances) {
    const key = mov.clientId;
    if (!clientMap.has(key)) clientMap.set(key, { client: mov.client, balances: [] });
    clientMap.get(key)!.balances.push({ currency: mov.currency, balance: parseFloat(String(mov.balance)) });
  }

  const providerMap = new Map<string, {
    provider: { id: string; fantasyName: string; code: number };
    balances: { currency: string; balance: number }[];
  }>();
  for (const mov of providerBalances) {
    const key = mov.providerId;
    if (!providerMap.has(key)) providerMap.set(key, { provider: mov.provider, balances: [] });
    providerMap.get(key)!.balances.push({ currency: mov.currency, balance: parseFloat(String(mov.balance)) });
  }

  const clients   = [...clientMap.values()].sort((a, b) => a.client.fantasyName.localeCompare(b.client.fantasyName));
  const providers = [...providerMap.values()].sort((a, b) => a.provider.fantasyName.localeCompare(b.provider.fantasyName));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Cuentas Corrientes</h1>
        <p className="text-muted-foreground text-sm">Saldos y movimientos de clientes y prestadores</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/${agencySlug}/cuentas?tab=${t.key}`}
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

      {/* ─── Clientes ─── */}
      {activeTab === "clientes" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Cód.</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-36 text-right">Saldo $</TableHead>
                <TableHead className="w-36 text-right">Saldo u$s</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Sin movimientos registrados.
                  </TableCell>
                </TableRow>
              ) : clients.map(({ client, balances }) => {
                const pesos = balances.find((b) => b.currency === "PESOS")?.balance ?? null;
                const usd   = balances.find((b) => b.currency === "USD")?.balance ?? null;
                return (
                  <TableRow key={client.id}>
                    <TableCell className="text-center text-sm font-mono">{client.code}</TableCell>
                    <TableCell>
                      <Link
                        href={`/${agencySlug}/cuentas/clientes/${client.id}`}
                        className="font-medium hover:underline"
                      >
                        {client.fantasyName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {pesos !== null ? (
                        <span className={pesos < 0 ? "text-green-600" : pesos > 0 ? "text-red-600" : "text-muted-foreground"}>
                          $ {fmt(pesos)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {usd !== null ? (
                        <span className={usd < 0 ? "text-green-600" : usd > 0 ? "text-red-600" : "text-muted-foreground"}>
                          u$s {fmt(usd)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/${agencySlug}/cuentas/clientes/${client.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
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

      {/* ─── Prestadores ─── */}
      {activeTab === "prestadores" && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Cód.</TableHead>
                <TableHead>Prestador</TableHead>
                <TableHead className="w-36 text-right">Saldo $</TableHead>
                <TableHead className="w-36 text-right">Saldo u$s</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Sin movimientos registrados.
                  </TableCell>
                </TableRow>
              ) : providers.map(({ provider, balances }) => {
                const pesos = balances.find((b) => b.currency === "PESOS")?.balance ?? null;
                const usd   = balances.find((b) => b.currency === "USD")?.balance ?? null;
                return (
                  <TableRow key={provider.id}>
                    <TableCell className="text-center text-sm font-mono">{provider.code}</TableCell>
                    <TableCell>
                      <Link
                        href={`/${agencySlug}/cuentas/prestadores/${provider.id}`}
                        className="font-medium hover:underline"
                      >
                        {provider.fantasyName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {pesos !== null ? (
                        <span className={pesos > 0 ? "text-amber-600" : "text-muted-foreground"}>
                          $ {fmt(pesos)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {usd !== null ? (
                        <span className={usd > 0 ? "text-amber-600" : "text-muted-foreground"}>
                          u$s {fmt(usd)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/${agencySlug}/cuentas/prestadores/${provider.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
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
    </div>
  );
}
