import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ProgramTariffForm } from "@/components/forms/program-tariff-form";

export default async function EditTarifaProgramaPage({
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

  const [programTariff, programs, roomTypes, pensionRegimes] = await Promise.all([
    prisma.programTariff.findUnique({ where: { id, agencyId: agency.id } }),
    prisma.program.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { name: "asc" } }),
    prisma.roomType.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { name: "asc" } }),
    prisma.pensionRegime.findMany({ where: { agencyId: agency.id }, orderBy: { name: "asc" } }),
  ]);

  if (!programTariff) notFound();

  const programName = programs.find((p) => p.id === programTariff.programId);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Editar Tarifa de Programa</h1>
        {programName && (
          <p className="text-muted-foreground text-sm">{programName.code} — {programName.name}</p>
        )}
      </div>
      <ProgramTariffForm
        agencyId={agency.id}
        agencySlug={agencySlug}
        item={programTariff}
        programs={programs}
        roomTypes={roomTypes.map((r) => ({ id: r.id, label: `${r.abbreviation} — ${r.name}` }))}
        pensionRegimes={pensionRegimes.map((p) => ({ id: p.id, label: `${p.abbreviation} — ${p.name}` }))}
      />
    </div>
  );
}
