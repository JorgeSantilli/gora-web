import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "@/components/forms/invoice-form";

export default async function NuevoNCPage({
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

  const [invoice, salePoints, clients] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id, agencyId: agency.id },
      include: { client: { select: { fantasyName: true } } },
    }),
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

  if (!invoice) notFound();
  if (invoice.isVoided || invoice.type !== "FA") redirect(`/${agencySlug}/facturacion/${id}`);

  const displayNumber = `${invoice.letter}-${String(invoice.salePoint).padStart(4, "0")}-${String(invoice.number).padStart(8, "0")}`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nota de Crédito</h1>
        <p className="text-muted-foreground text-sm">Sobre factura {displayNumber} — {invoice.client.fantasyName}</p>
      </div>
      <InvoiceForm
        mode="nc"
        agencyId={agency.id}
        agencySlug={agencySlug}
        salePoints={salePoints}
        clients={clients.map((c) => ({
          id: c.id,
          fantasyName: c.fantasyName,
          taxPosition: c.taxPosition,
          taxId: c.taxId,
        }))}
        original={{
          id: invoice.id,
          displayNumber,
          letter: invoice.letter,
          clientId: invoice.clientId,
          serviceFrom: invoice.serviceFrom?.toISOString() ?? null,
          serviceTo: invoice.serviceTo?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
