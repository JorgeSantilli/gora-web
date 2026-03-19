import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage({
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

  const agency = await prisma.agency.findUnique({
    where: { slug: agencySlug },
  });

  if (!agency) redirect("/login");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard — {agency.name}</h1>
      <p className="text-muted-foreground mt-1">Bienvenido al sistema GORA</p>
    </div>
  );
}
