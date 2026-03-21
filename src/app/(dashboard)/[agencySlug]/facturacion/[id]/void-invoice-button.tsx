"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { voidInvoice } from "@/actions/facturacion.actions";

interface VoidInvoiceButtonProps {
  invoiceId:     string;
  agencyId:      string;
  agencySlug:    string;
  displayNumber: string;
}

export function VoidInvoiceButton({ invoiceId, agencyId, agencySlug, displayNumber }: VoidInvoiceButtonProps) {
  const [pending, start] = useTransition();

  function handleVoid() {
    if (!confirm(`¿Anular el comprobante ${displayNumber}? Esta acción no se puede deshacer.`)) return;
    start(async () => {
      try {
        await voidInvoice(invoiceId, agencyId, agencySlug);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al anular");
      }
    });
  }

  return (
    <Button variant="destructive" disabled={pending} onClick={handleVoid}>
      Anular
    </Button>
  );
}
