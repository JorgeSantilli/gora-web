import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ParametrosClient } from "./parametros-client";

export default async function ParametrosPage({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}) {
  const { agencySlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const agency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
  if (!agency) redirect("/login");

  const [
    serviceProviderTypes,
    pensionRegimes,
    roomTypes,
    foodTypes,
    clientTypes,
    providerOrigins,
    reservationOrigins,
    guideTypes,
  ] = await Promise.all([
    prisma.serviceProviderType.findMany({
      where: { agencyId: agency.id },
      orderBy: { code: "asc" },
    }),
    prisma.pensionRegime.findMany({
      where: { agencyId: agency.id },
      orderBy: { code: "asc" },
    }),
    prisma.roomType.findMany({
      where: { agencyId: agency.id },
      orderBy: { code: "asc" },
    }),
    prisma.foodType.findMany({
      where: { agencyId: agency.id },
      orderBy: { code: "asc" },
    }),
    prisma.clientType.findMany({
      where: { agencyId: agency.id },
      orderBy: { code: "asc" },
    }),
    prisma.providerOrigin.findMany({
      where: { agencyId: agency.id },
      orderBy: { code: "asc" },
    }),
    prisma.reservationOrigin.findMany({
      where: { agencyId: agency.id },
      orderBy: { letter: "asc" },
    }),
    prisma.guideType.findMany({
      where: { agencyId: agency.id },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <div className="p-6 space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Parámetros</h1>
        <p className="text-muted-foreground text-sm">
          Tablas de configuración base del sistema
        </p>
      </div>

      <ParametrosClient
        agencyId={agency.id}
        serviceProviderTypes={serviceProviderTypes}
        pensionRegimes={pensionRegimes}
        roomTypes={roomTypes}
        foodTypes={foodTypes}
        clientTypes={clientTypes}
        providerOrigins={providerOrigins}
        reservationOrigins={reservationOrigins}
        guideTypes={guideTypes}
      />
    </div>
  );
}
