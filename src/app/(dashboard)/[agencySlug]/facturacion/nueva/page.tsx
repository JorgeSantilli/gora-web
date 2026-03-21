import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "@/components/forms/invoice-form";

export default async function NuevoComprobantePage({
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

  const [salePoints, clients] = await Promise.all([
    prisma.salePoint.findMany({
      where: { agencyId: agency.id, active: true },
      orderBy: { number: "asc" },
    }),
    prisma.client.findMany({
      where: { agencyId: agency.id, active: true },
      select: { id: true, fantasyName: true, taxPosition: true, taxId: true },
      orderBy: { fantasyName: "asc" },
    }),
  ]);

  if (salePoints.length === 0) {
    redirect(`/${agencySlug}/parametros`);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nuevo Comprobante</h1>
        <p className="text-muted-foreground text-sm">Factura o Nota de Débito</p>
      </div>
      <InvoiceForm
        mode="nueva"
        agencyId={agency.id}
        agencySlug={agencySlug}
        salePoints={salePoints}
        clients={clients.map((c) => ({
          id: c.id,
          fantasyName: c.fantasyName,
          taxPosition: c.taxPosition,
          taxId: c.taxId,
        }))}
      />
    </div>
  );
}
