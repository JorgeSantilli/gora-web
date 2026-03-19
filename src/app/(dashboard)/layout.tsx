import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { agency: { select: { id: true, name: true, slug: true } } },
  });

  if (!dbUser) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar user={dbUser} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <Toaster richColors />
    </SidebarProvider>
  );
}
