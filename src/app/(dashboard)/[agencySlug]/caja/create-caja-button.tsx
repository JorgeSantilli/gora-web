"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createDailyCash } from "@/actions/caja.actions";
import { useRouter } from "next/navigation";

interface Props {
  agencyId:   string;
  agencySlug: string;
}

export function CreateCajaButton({ agencyId, agencySlug }: Props) {
  const [open, setOpen]           = useState(false);
  const [currency, setCurrency]   = useState("PESOS");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  function handleCreate() {
    startTransition(async () => {
      try {
        const id = await createDailyCash(agencyId, agencySlug, {
          date: today,
          currency,
        });
        router.push(`/${agencySlug}/caja/${id}`);
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Error al crear la caja");
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" /> Nueva Caja
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 border rounded-md p-2 bg-background shadow-sm">
      <span className="text-sm text-muted-foreground">Moneda:</span>
      <Select value={currency} onValueChange={(v) => setCurrency(v ?? "PESOS")}>
        <SelectTrigger className="w-28 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PESOS">PESOS</SelectItem>
          <SelectItem value="USD">USD</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleCreate} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
        Cancelar
      </Button>
    </div>
  );
}
