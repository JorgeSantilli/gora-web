import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CostTariffForm } from "@/components/forms/cost-tariff-form";

export default async function EditCostoPage({
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

  const [cost, providers, pensionRegimes, roomTypes, foodTypes, excursionCodes, transferSegments, ticketSegments] =
    await Promise.all([
      prisma.cost.findUnique({ where: { id, agencyId: agency.id } }),
      prisma.provider.findMany({ where: { agencyId: agency.id, active: true }, select: { id: true, fantasyName: true }, orderBy: { fantasyName: "asc" } }),
      prisma.pensionRegime.findMany({ where: { agencyId: agency.id }, orderBy: { name: "asc" } }),
      prisma.roomType.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { name: "asc" } }),
      prisma.foodType.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { name: "asc" } }),
      prisma.excursionCode.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { code: "asc" } }),
      prisma.transferSegment.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { code: "asc" } }),
      prisma.ticketSegment.findMany({ where: { agencyId: agency.id, active: true }, orderBy: { code: "asc" } }),
    ]);

  if (!cost) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Editar Costo</h1>
        <p className="text-muted-foreground text-sm">{providers.find((p) => p.id === cost.providerId)?.fantasyName}</p>
      </div>
      <CostTariffForm
        mode="cost"
        agencyId={agency.id}
        agencySlug={agencySlug}
        item={cost}
        providers={providers}
        pensionRegimes={pensionRegimes.map((p) => ({ id: p.id, label: `${p.abbreviation} — ${p.name}` }))}
        roomTypes={roomTypes.map((r) => ({ id: r.id, label: `${r.abbreviation} — ${r.name}` }))}
        foodTypes={foodTypes.map((f) => ({ id: f.id, label: f.name }))}
        excursionCodes={excursionCodes.map((e) => ({ id: e.id, label: `${e.code} — ${e.name}` }))}
        transferSegments={transferSegments.map((t) => ({ id: t.id, label: `${t.code} — ${t.name}` }))}
        ticketSegments={ticketSegments.map((t) => ({ id: t.id, label: `${t.code} — ${t.name}` }))}
      />
    </div>
  );
}
