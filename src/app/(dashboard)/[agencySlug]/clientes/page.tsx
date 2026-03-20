import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { ToggleActiveButton } from "./toggle-active-button";

export default async function ClientesPage({
  params,
  searchParams,
}: {
  params: Promise<{ agencySlug: string }>;
  searchParams: Promise<{ q?: string; tipo?: string; activo?: string; directo?: string }>;
}) {
  const { agencySlug } = await params;
  const { q, tipo, activo, directo } = await searchParams;

  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const [clients, clientTypes] = await Promise.all([
    prisma.client.findMany({
      where: {
        agencyId: agency.id,
        ...(q && {
          OR: [
            { fantasyName: { contains: q, mode: "insensitive" } },
            { legalName: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
            { taxId: { contains: q, mode: "insensitive" } },
          ],
        }),
        ...(tipo && { clientTypeId: tipo }),
        ...(directo === "true" ? { isDirect: true } : directo === "false" ? { isDirect: false } : {}),
        ...(activo === "false" ? { active: false } : activo === "true" ? { active: true } : {}),
      },
      include: {
        clientType: { select: { name: true } },
      },
      orderBy: [{ isDirect: "asc" }, { fantasyName: "asc" }],
    }),
    prisma.clientType.findMany({
      where: { agencyId: agency.id, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const taxLabels: Record<string, string> = {
    RI: "Resp. Inscripto",
    MO: "Monotributista",
    CF: "Cons. Final",
    EX: "Exento",
    NC: "No Categ.",
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">
            {clients.length} registro{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href={`/${agencySlug}/clientes/nuevo`} />}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filtros */}
      <form className="flex gap-2 flex-wrap" method="GET">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, ciudad o CUIT..."
          className="max-w-xs"
        />
        <select
          name="tipo"
          defaultValue={tipo ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos los tipos</option>
          {clientTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          name="directo"
          defaultValue={directo ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Agencias y directos</option>
          <option value="false">Solo agencias</option>
          <option value="true">Solo directos</option>
        </select>
        <select
          name="activo"
          defaultValue={activo ?? "true"}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
          <option value="">Todos</option>
        </select>
        <Button type="submit" variant="outline" size="sm">
          Filtrar
        </Button>
        <Button variant="ghost" size="sm" render={<Link href={`/${agencySlug}/clientes`} />}>
          Limpiar
        </Button>
      </form>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Cód.</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Condición IVA</TableHead>
              <TableHead className="w-20">Estado</TableHead>
              <TableHead className="w-20">Acc.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No hay clientes.{" "}
                  <Link href={`/${agencySlug}/clientes/nuevo`} className="underline">
                    Crear el primero
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((c) => (
                <TableRow key={c.id} className={!c.active ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-sm">{c.code}</TableCell>
                  <TableCell>
                    <div className="font-medium">{c.fantasyName}</div>
                    {c.legalName && c.legalName !== c.fantasyName && (
                      <div className="text-xs text-muted-foreground">{c.legalName}</div>
                    )}
                    {c.isDirect && (
                      <Badge variant="outline" className="text-xs mt-0.5">Directo</Badge>
                    )}
                    {c.hasCreditAccount && (
                      <Badge variant="secondary" className="text-xs mt-0.5 ml-1">Cta. Cte.</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.clientType?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{c.city ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{c.taxId ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {c.taxPosition ? (
                      <Badge variant="secondary" className="text-xs">
                        {taxLabels[c.taxPosition] ?? c.taxPosition}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <ToggleActiveButton
                      id={c.id}
                      agencyId={agency.id}
                      active={c.active}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/clientes/${c.id}`} />}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
