"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toggleClientActive } from "@/actions/clientes.actions";

export function ToggleActiveButton({
  id,
  agencyId,
  active,
}: {
  id: string;
  agencyId: string;
  active: boolean;
}) {
  const [isActive, setIsActive] = useState(active);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await toggleClientActive(id, agencyId, !isActive);
    setIsActive(!isActive);
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading} className="cursor-pointer">
      <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
        {isActive ? "Activo" : "Inactivo"}
      </Badge>
    </button>
  );
}
