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

export default async function ProgramasPage({
  params,
  searchParams,
}: {
  params: Promise<{ agencySlug: string }>;
  searchParams: Promise<{ q?: string; activo?: string }>;
}) {
  const { agencySlug } = await params;
  const { q, activo } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const programs = await prisma.program.findMany({
    where: {
      agencyId: agency.id,
      ...(q && { name: { contains: q, mode: "insensitive" } }),
      ...(activo === "false" ? { active: false } : activo === "true" ? { active: true } : {}),
    },
    include: {
      _count: {
        select: {
          programHotels: true,
          programMeals: true,
          programExcursions: true,
          programTransfers: true,
          programTickets: true,
          programRentals: true,
          programMiscs: true,
        },
      },
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programas</h1>
          <p className="text-muted-foreground text-sm">
            {programs.length} registro{programs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href={`/${agencySlug}/programas/nuevo`} />}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Programa
        </Button>
      </div>

      {/* Filtros */}
      <form className="flex gap-2 flex-wrap" method="GET">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          className="max-w-xs"
        />
        <select
          name="activo"
          defaultValue={activo ?? "true"}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
          <option value="">Todos</option>
        </select>
        <Button type="submit" variant="outline" size="sm">Filtrar</Button>
        <Button variant="ghost" size="sm" render={<Link href={`/${agencySlug}/programas`} />}>
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
              <TableHead className="w-24">Tipo</TableHead>
              <TableHead className="w-24 text-center">Días/Noches</TableHead>
              <TableHead className="w-32 text-center">Servicios</TableHead>
              <TableHead className="w-20">Estado</TableHead>
              <TableHead className="w-20">Acc.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No hay programas.{" "}
                  <Link href={`/${agencySlug}/programas/nuevo`} className="underline">
                    Crear el primero
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              programs.map((p) => {
                const totalServices =
                  p._count.programHotels +
                  p._count.programMeals +
                  p._count.programExcursions +
                  p._count.programTransfers +
                  p._count.programTickets +
                  p._count.programRentals +
                  p._count.programMiscs;

                return (
                  <TableRow key={p.id} className={!p.active ? "opacity-50" : ""}>
                    <TableCell className="font-mono text-sm">{p.code}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant={p.isFixedBase ? "default" : "secondary"} className="text-xs">
                        {p.isFixedBase ? "Base fija" : "Variable"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {p.days != null || p.nights != null
                        ? `${p.days ?? "—"}d / ${p.nights ?? "—"}n`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {totalServices > 0 ? (
                        <span className="text-muted-foreground">
                          {totalServices} item{totalServices !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ToggleActiveButton id={p.id} agencyId={agency.id} active={p.active} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon" variant="ghost" className="h-8 w-8"
                        render={<Link href={`/${agencySlug}/programas/${p.id}`} />}
                      >
                        <Pencil className="h-3.5 w-3.5" />
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
