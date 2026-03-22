"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteCashTransaction } from "@/actions/caja.actions";
import { useRouter } from "next/navigation";

interface Props {
  transactionId: string;
  dailyCashId:   string;
  agencyId:      string;
  agencySlug:    string;
}

export function DeleteTransactionButton({ transactionId, dailyCashId, agencyId, agencySlug }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("¿Eliminar este movimiento?")) return;
    startTransition(async () => {
      try {
        await deleteCashTransaction(transactionId, dailyCashId, agencyId, agencySlug);
        router.refresh();
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Error al eliminar");
      }
    });
  }

  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
      onClick={handleDelete} disabled={isPending}>
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </Button>
  );
}
