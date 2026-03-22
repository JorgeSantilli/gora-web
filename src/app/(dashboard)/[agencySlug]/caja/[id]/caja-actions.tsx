"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LockOpen, Lock } from "lucide-react";
import { openDailyCash, closeDailyCash } from "@/actions/caja.actions";
import { useRouter } from "next/navigation";

interface Props {
  cash:       { id: string; status: string };
  agencyId:   string;
  agencySlug: string;
  userName:   string;
}

export function CajaActions({ cash, agencyId, agencySlug, userName }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleOpen() {
    startTransition(async () => {
      try {
        await openDailyCash(cash.id, agencyId, agencySlug);
        router.refresh();
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Error al abrir la caja");
      }
    });
  }

  function handleClose() {
    if (!confirm("¿Confirma el cierre de la caja? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      try {
        await closeDailyCash(cash.id, agencyId, agencySlug, userName);
        router.refresh();
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Error al cerrar la caja");
      }
    });
  }

  if (cash.status === "PENDING") {
    return (
      <Button onClick={handleOpen} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LockOpen className="h-4 w-4 mr-2" />}
        Abrir Caja
      </Button>
    );
  }

  if (cash.status === "OPEN") {
    return (
      <Button variant="destructive" onClick={handleClose} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
        Cerrar Caja
      </Button>
    );
  }

  return null;
}
