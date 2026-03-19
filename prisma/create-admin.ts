/**
 * Crea el usuario admin en Supabase Auth y en la tabla users
 * Ejecutar con: npx dotenv -e .env.local -- tsx prisma/create-admin.ts
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const ADMIN_EMAIL = "admin@goraturismo.com.ar";
const ADMIN_PASSWORD = "Gora2024Admin!";
const AGENCY_ID = "agency_gora_001";

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verificar si ya existe
  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingUser = existing?.users?.find((u) => u.email === ADMIN_EMAIL);

  let userId: string;

  if (existingUser) {
    console.log("ℹ️  Usuario ya existe:", ADMIN_EMAIL);
    userId = existingUser.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log("✅ Auth user creado:", ADMIN_EMAIL, "ID:", userId);
  }

  // Insertar en tabla users via REST (sin Prisma)
  const { error: insertError } = await supabase.from("users").upsert(
    {
      id: crypto.randomUUID(),
      supabaseId: userId,
      email: ADMIN_EMAIL,
      name: "Administrador GORA",
      role: "ADMIN",
      agencyId: AGENCY_ID,
      active: true,
      updatedAt: new Date().toISOString(),
    },
    { onConflict: "supabaseId" }
  );

  if (insertError) {
    console.error("Error insertando usuario:", insertError);
  } else {
    console.log("✅ Usuario en DB creado");
  }

  console.log("\n🎉 Admin listo:");
  console.log("   Email:", ADMIN_EMAIL);
  console.log("   Password:", ADMIN_PASSWORD);
  console.log("   URL: http://localhost:3000/gora");
}

main().catch(console.error);
