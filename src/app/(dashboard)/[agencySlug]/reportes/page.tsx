import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { BarChart3, Users, DollarSign, Building2, FileText, CalendarCheck } from "lucide-react";

const REPORTS = [
  {
    slug:        "reservas-estado",
    title:       "Estado de Reservas",
    description: "Cantidad de reservas por estado en un período",
    icon:        CalendarCheck,
  },
  {
    slug:        "pasajeros-programa",
    title:       "Pasajeros por Programa",
    description: "Total de pasajeros (adultos + menores) agrupados por programa",
    icon:        Users,
  },
  {
    slug:        "facturacion-cliente",
    title:       "Facturación por Cliente",
    description: "Total facturado por cliente en un período",
    icon:        DollarSign,
  },
  {
    slug:        "facturas-pendientes",
    title:       "Facturas Pendientes de Cobro",
    description: "Facturas con saldo pendiente mayor a cero",
    icon:        FileText,
  },
  {
    slug:        "movimientos-caja",
    title:       "Movimientos de Caja",
    description: "Entradas y salidas de caja por período",
    icon:        BarChart3,
  },
  {
    slug:        "ocupacion-hotelera",
    title:       "Ocupación Hotelera",
    description: "Reservas con alojamiento por hotel y período",
    icon:        Building2,
  },
];

export default async function ReportesPage({
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-muted-foreground text-sm">Consultas y estadísticas sobre datos del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.slug}
              href={`/${agencySlug}/reportes/${report.slug}`}
              className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-sm">{report.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
