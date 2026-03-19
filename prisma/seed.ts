/**
 * Seed de GORA Turismo
 * Los parámetros base (tipos, regímenes, etc.) se insertan via prisma/seed.sql
 * Este script verifica la conexión y confirma que el seed estuvo OK.
 *
 * Para re-insertar datos base: npx supabase db query --file prisma/seed.sql --linked
 * Para crear admin:           npx dotenv -e .env.local -- tsx prisma/create-admin.ts
 */
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔍 Verificando datos en GORA Turismo...\n");

  const agency = await prisma.agency.findUnique({ where: { slug: "gora" } });
  if (!agency) throw new Error("Agency 'gora' not found — run seed.sql first");
  console.log("✅ Agency:", agency.name, `(id: ${agency.id})`);

  const users = await prisma.user.count({ where: { agencyId: agency.id } });
  console.log("✅ Usuarios:", users);

  const serviceTypes = await prisma.serviceProviderType.count({ where: { agencyId: agency.id } });
  const pensions = await prisma.pensionRegime.count({ where: { agencyId: agency.id } });
  const roomTypes = await prisma.roomType.count({ where: { agencyId: agency.id } });
  const foodTypes = await prisma.foodType.count({ where: { agencyId: agency.id } });
  const clientTypes = await prisma.clientType.count({ where: { agencyId: agency.id } });
  const origins = await prisma.reservationOrigin.count({ where: { agencyId: agency.id } });
  const providers = await prisma.provider.count({ where: { agencyId: agency.id } });

  console.log("✅ Tipos de servicio:", serviceTypes);
  console.log("✅ Regímenes de pensión:", pensions);
  console.log("✅ Tipos de habitación:", roomTypes);
  console.log("✅ Tipos de comida:", foodTypes);
  console.log("✅ Tipos de cliente:", clientTypes);
  console.log("✅ Orígenes de reserva:", origins);
  console.log("✅ Prestadores:", providers);

  console.log("\n🎉 Base de datos lista para desarrollo!");
  console.log("   Admin: admin@goraturismo.com.ar / Gora2024Admin!");
  console.log("   URL:   http://localhost:3000/gora");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
