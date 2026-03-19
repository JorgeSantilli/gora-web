"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User, Agency } from "@/generated/prisma";

type AppUser = User & { agency: Pick<Agency, "id" | "name" | "slug"> };

const navGroups = [
  {
    label: "Operaciones",
    items: [
      { title: "Reservas", href: "reservas", icon: "🗓" },
      { title: "Clientes", href: "clientes", icon: "👥" },
      { title: "Prestadores", href: "prestadores", icon: "🏨" },
      { title: "Programas", href: "programas", icon: "📋" },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { title: "Facturación", href: "facturacion", icon: "🧾" },
      { title: "Ing. de Valores", href: "ingresos", icon: "💰" },
      { title: "Órdenes de Pago", href: "ordenes-pago", icon: "📤" },
      { title: "Caja Diaria", href: "caja", icon: "🏦" },
      { title: "IVA", href: "iva", icon: "📊" },
      { title: "Cuentas Corrientes", href: "cuentas", icon: "📈" },
    ],
  },
  {
    label: "Receptivo",
    items: [
      { title: "Receptivo", href: "receptivo", icon: "🚌" },
    ],
  },
  {
    label: "Configuración",
    items: [
      { title: "Tarifas", href: "tarifas", icon: "💲" },
      { title: "Parámetros", href: "parametros", icon: "⚙️" },
    ],
  },
];

export function AppSidebar({ user }: { user: AppUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const baseHref = `/${user.agency.slug}`;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div>
          <p className="font-bold text-lg">GORA</p>
          <p className="text-xs text-muted-foreground">{user.agency.name}</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const href = `${baseHref}/${item.href}`;
                const isActive = pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link href={href} />}
                    >
                      <span>{item.icon}</span>
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted transition-colors text-left"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <Badge variant="secondary" className="text-xs">
                {user.role === "ADMIN"
                  ? "Admin"
                  : user.role === "OPERATOR_ADMIN"
                  ? "Op. Admin"
                  : "Operador"}
              </Badge>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleSignOut}>
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
