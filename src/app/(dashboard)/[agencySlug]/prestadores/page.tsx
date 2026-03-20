import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

export default async function PrestadoresPage({
  params,
  searchParams,
}: {
  params: Promise<{ agencySlug: string }>;
  searchParams: Promise<{ q?: string; tipo?: string; activo?: string }>;
}) {
  const { agencySlug } = await params;
  const { q, tipo, activo } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const [providers, serviceProviderTypes] = await Promise.all([
    prisma.provider.findMany({
      where: {
        agencyId: agency.id,
        ...(q && {
          OR: [
            { fantasyName: { contains: q, mode: "insensitive" } },
            { legalName: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }),
        ...(tipo && { typeId: tipo }),
        ...(activo === "false" ? { active: false } : activo === "true" ? { active: true } : {}),
      },
      include: {
        serviceProviderType: { select: { name: true } },
        origin: { select: { name: true } },
      },
      orderBy: [{ isSupplier: "asc" }, { fantasyName: "asc" }],
    }),
    prisma.serviceProviderType.findMany({
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
          <h1 className="text-2xl font-bold">Prestadores</h1>
          <p className="text-muted-foreground text-sm">
            {providers.length} registro{providers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href={`/${agencySlug}/prestadores/nuevo`} />}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Prestador
        </Button>
      </div>

      {/* Filtros */}
      <form className="flex gap-2 flex-wrap" method="GET">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o ciudad..."
          className="max-w-xs"
        />
        <select
          name="tipo"
          defaultValue={tipo ?? ""}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos los tipos</option>
          {serviceProviderTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
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
        <Button variant="ghost" size="sm" render={<Link href={`/${agencySlug}/prestadores`} />}>
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
            {providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No hay prestadores.{" "}
                  <Link href={`/${agencySlug}/prestadores/nuevo`} className="underline">
                    Crear el primero
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              providers.map((p) => (
                <TableRow key={p.id} className={!p.active ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-sm">{p.code}</TableCell>
                  <TableCell>
                    <div className="font-medium">{p.fantasyName}</div>
                    {p.legalName && p.legalName !== p.fantasyName && (
                      <div className="text-xs text-muted-foreground">{p.legalName}</div>
                    )}
                    {p.isSupplier && (
                      <Badge variant="outline" className="text-xs mt-0.5">Proveedor</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.serviceProviderType?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{p.city ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{p.taxId ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {p.taxPosition ? (
                      <Badge variant="secondary" className="text-xs">
                        {taxLabels[p.taxPosition] ?? p.taxPosition}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <ToggleActiveButton
                      id={p.id}
                      agencyId={agency.id}
                      active={p.active}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-8 w-8" render={<Link href={`/${agencySlug}/prestadores/${p.id}`} />}>
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
