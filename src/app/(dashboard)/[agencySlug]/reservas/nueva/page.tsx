import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ReservationForm } from "@/components/forms/reservation-form";

export default async function NuevaReservaPage({
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

  const [origins, clients, programs] = await Promise.all([
    prisma.reservationOrigin.findMany({
      where: { agencyId: agency.id },
      orderBy: { letter: "asc" },
    }),
    prisma.client.findMany({
      where: { agencyId: agency.id, active: true },
      orderBy: { fantasyName: "asc" },
    }),
    prisma.program.findMany({
      where: { agencyId: agency.id, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nueva Reserva</h1>
        <p className="text-muted-foreground text-sm">
          El número se asignará automáticamente según el origen seleccionado
        </p>
      </div>
      <ReservationForm
        agencyId={agency.id}
        agencySlug={agencySlug}
        origins={origins}
        clients={clients}
        programs={programs}
      />
    </div>
  );
}
