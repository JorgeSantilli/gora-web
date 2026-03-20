"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { confirmReservation, cancelReservation, markVouchersIssued } from "@/actions/reservas.actions";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, FileText } from "lucide-react";

interface StatusActionsProps {
  reservationId: string;
  agencyId: string;
  agencySlug: string;
  status: string;
  confirmedBy?: string | null;
  currentUserName: string;
}

export function ReservationStatusActions({
  reservationId, agencyId, agencySlug, status, currentUserName,
}: StatusActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(action: () => Promise<void>) {
    start(async () => {
      try { await action(); router.refresh(); }
      catch { toast.error("Error al actualizar estado"); }
    });
  }

  if (status === "TENTATIVE") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm" variant="default" disabled={pending}
          onClick={() => run(() => confirmReservation(reservationId, agencyId, agencySlug, currentUserName))}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Confirmar
        </Button>
        <Button
          size="sm" variant="destructive" disabled={pending}
          onClick={() => run(() => cancelReservation(reservationId, agencyId, agencySlug))}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm" variant="outline" disabled={pending}
          onClick={() => run(() => markVouchersIssued(reservationId, agencyId, agencySlug))}
        >
          <FileText className="h-4 w-4 mr-1" />
          Emitir Vouchers
        </Button>
        <Button
          size="sm" variant="destructive" disabled={pending}
          onClick={() => run(() => cancelReservation(reservationId, agencyId, agencySlug))}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
      </div>
    );
  }

  return null;
}
