import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ProgramTariffForm } from "@/components/forms/program-tariff-form";

export default async function NuevaTarifaProgramaPage({
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

  const [programs, roomTypes, pensionRegimes] = await Promise.all([
    prisma.program.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { name: "asc" } }),
    prisma.roomType.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { name: "asc" } }),
    prisma.pensionRegime.findMany({ where: { agencyId: agency.id }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nueva Tarifa de Programa</h1>
        <p className="text-muted-foreground text-sm">Tarifa global por programa, medio de transporte y rango de pax</p>
      </div>
      <ProgramTariffForm
        agencyId={agency.id}
        agencySlug={agencySlug}
        programs={programs}
        roomTypes={roomTypes.map((r) => ({ id: r.id, label: `${r.abbreviation} — ${r.name}` }))}
        pensionRegimes={pensionRegimes.map((p) => ({ id: p.id, label: `${p.abbreviation} — ${p.name}` }))}
      />
    </div>
  );
}
