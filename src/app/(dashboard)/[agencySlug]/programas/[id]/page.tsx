import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ProgramForm } from "@/components/forms/program-form";
import { ProgramServices } from "@/components/forms/program-services";
import { Separator } from "@/components/ui/separator";

export default async function EditarProgramaPage({
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

  const [program, providers, pensionRegimes, foodTypes, excursionCodes, transferSegments, ticketSegments] =
    await Promise.all([
      prisma.program.findUnique({
        where: { id, agencyId: agency.id },
        include: {
          programHotels: {
            include: { provider: { select: { id: true, fantasyName: true } } },
            orderBy: { order: "asc" },
          },
          programMeals: {
            include: {
              provider: { select: { id: true, fantasyName: true } },
            },
          },
          programExcursions: {
            include: { provider: { select: { id: true, fantasyName: true } } },
          },
          programTransfers: {
            include: { provider: { select: { id: true, fantasyName: true } } },
          },
          programTickets: {
            include: { provider: { select: { id: true, fantasyName: true } } },
          },
          programRentals: {
            include: { provider: { select: { id: true, fantasyName: true } } },
          },
          programMiscs: {
            include: { provider: { select: { id: true, fantasyName: true } } },
          },
        },
      }),
      prisma.provider.findMany({
        where: { agencyId: agency.id, active: true },
        select: { id: true, fantasyName: true },
        orderBy: { fantasyName: "asc" },
      }),
      prisma.pensionRegime.findMany({
        where: { agencyId: agency.id },
        orderBy: { name: "asc" },
      }),
      prisma.foodType.findMany({
        where: { agencyId: agency.id, active: true },
        orderBy: { name: "asc" },
      }),
      prisma.excursionCode.findMany({
        where: { agencyId: agency.id, active: true },
        orderBy: { code: "asc" },
      }),
      prisma.transferSegment.findMany({
        where: { agencyId: agency.id, active: true },
        orderBy: { code: "asc" },
      }),
      prisma.ticketSegment.findMany({
        where: { agencyId: agency.id, active: true },
        orderBy: { code: "asc" },
      }),
    ]);

  if (!program) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Editar Programa</h1>
        <p className="text-muted-foreground text-sm">
          #{program.code} — {program.name}
        </p>
      </div>

      {/* Encabezado */}
      <ProgramForm agencyId={agency.id} agencySlug={agencySlug} program={program} />

      <Separator />

      {/* Servicios */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Servicios del programa</h2>
        <ProgramServices
          programId={program.id}
          agencyId={agency.id}
          hotels={program.programHotels}
          meals={program.programMeals.map((m) => ({
            ...m,
            foodTypeName: foodTypes.find((f) => f.id === m.foodTypeId)?.name ?? null,
          }))}
          excursions={program.programExcursions.map((ex) => ({
            ...ex,
            excursionCodeLabel: excursionCodes.find((c) => c.id === ex.excursionCodeId)
              ? `${excursionCodes.find((c) => c.id === ex.excursionCodeId)!.code} — ${excursionCodes.find((c) => c.id === ex.excursionCodeId)!.name}`
              : null,
          }))}
          transfers={program.programTransfers.map((t) => ({
            ...t,
            transferSegmentLabel: transferSegments.find((s) => s.id === t.transferSegmentId)
              ? `${transferSegments.find((s) => s.id === t.transferSegmentId)!.code} — ${transferSegments.find((s) => s.id === t.transferSegmentId)!.name}`
              : null,
          }))}
          tickets={program.programTickets.map((t) => ({
            ...t,
            ticketSegmentLabel: ticketSegments.find((s) => s.id === t.ticketSegmentId)
              ? `${ticketSegments.find((s) => s.id === t.ticketSegmentId)!.code} — ${ticketSegments.find((s) => s.id === t.ticketSegmentId)!.name}`
              : null,
          }))}
          rentals={program.programRentals}
          miscs={program.programMiscs}
          providers={providers}
          pensionRegimes={pensionRegimes}
          foodTypes={foodTypes}
          excursionCodes={excursionCodes}
          transferSegments={transferSegments}
          ticketSegments={ticketSegments}
        />
      </div>
    </div>
  );
}
