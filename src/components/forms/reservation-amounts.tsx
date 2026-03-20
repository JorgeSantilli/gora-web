"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateReservationAmounts } from "@/actions/reservas.actions";

interface AmountsProps {
  reservationId: string;
  agencyId: string;
  agencySlug: string;
  currency: "PESOS" | "USD";
  totalAmount: number | null;
  taxableAmount: number | null;
  transportTaxableAmount: number | null;
  nonComputedAmount: number | null;
  exemptAmount: number | null;
  vatGeneral: number | null;
  vatTransport: number | null;
  taxes: number | null;
  agencyCommissionAmount: number | null;
  netAmount: number | null;
  totalInvoice: number | null;
}

function MoneyField({ label, value, onChange, currency }: {
  label: string; value: string; onChange: (v: string) => void; currency: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {currency === "USD" ? "u$s" : "$"}
        </span>
        <Input
          type="number" value={value}
          onChange={(e) => onChange(e.target.value)}
          min={0} step={0.01}
          className="pl-9 text-right font-mono text-sm"
          placeholder="0.00"
        />
      </div>
    </div>
  );
}

export function ReservationAmounts({
  reservationId, agencyId, agencySlug, currency,
  totalAmount, taxableAmount, transportTaxableAmount, nonComputedAmount,
  exemptAmount, vatGeneral, vatTransport, taxes,
  agencyCommissionAmount, netAmount, totalInvoice,
}: AmountsProps) {
  const sym = currency === "USD" ? "u$s" : "$";
  const fmt = (v: number | null) => v != null ? v.toLocaleString("es-AR", { minimumFractionDigits: 2 }) : "—";

  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  const [fTaxable, setFTaxable] = useState(taxableAmount?.toString() ?? "");
  const [fTransport, setFTransport] = useState(transportTaxableAmount?.toString() ?? "");
  const [fNonComp, setFNonComp] = useState(nonComputedAmount?.toString() ?? "");
  const [fExempt, setFExempt] = useState(exemptAmount?.toString() ?? "");
  const [fVatGeneral, setFVatGeneral] = useState(vatGeneral?.toString() ?? "");
  const [fVatTransport, setFVatTransport] = useState(vatTransport?.toString() ?? "");
  const [fTaxes, setFTaxes] = useState(taxes?.toString() ?? "");
  const [fCommission, setFCommission] = useState(agencyCommissionAmount?.toString() ?? "");
  const [fNet, setFNet] = useState(netAmount?.toString() ?? "");
  const [fTotal, setFTotal] = useState(totalAmount?.toString() ?? "");
  const [fTotalInvoice, setFTotalInvoice] = useState(totalInvoice?.toString() ?? "");

  function save() {
    start(async () => {
      try {
        await updateReservationAmounts(reservationId, agencyId, agencySlug, {
          taxableAmount: fTaxable ? Number(fTaxable) : undefined,
          transportTaxableAmount: fTransport ? Number(fTransport) : undefined,
          nonComputedAmount: fNonComp ? Number(fNonComp) : undefined,
          exemptAmount: fExempt ? Number(fExempt) : undefined,
          vatGeneral: fVatGeneral ? Number(fVatGeneral) : undefined,
          vatTransport: fVatTransport ? Number(fVatTransport) : undefined,
          taxes: fTaxes ? Number(fTaxes) : undefined,
          agencyCommissionAmount: fCommission ? Number(fCommission) : undefined,
          netAmount: fNet ? Number(fNet) : undefined,
          totalAmount: fTotal ? Number(fTotal) : undefined,
          totalInvoice: fTotalInvoice ? Number(fTotalInvoice) : undefined,
        });
        toast.success("Importes guardados");
        setEditing(false);
      } catch { toast.error("Error al guardar"); }
    });
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gravado 21%</span>
            <span className="font-mono">{sym} {fmt(taxableAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA 21%</span>
            <span className="font-mono">{sym} {fmt(vatGeneral)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gravado Transp. 10.5%</span>
            <span className="font-mono">{sym} {fmt(transportTaxableAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA 10.5%</span>
            <span className="font-mono">{sym} {fmt(vatTransport)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">No Computable</span>
            <span className="font-mono">{sym} {fmt(nonComputedAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Impuestos</span>
            <span className="font-mono">{sym} {fmt(taxes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exento</span>
            <span className="font-mono">{sym} {fmt(exemptAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Comisión agencia</span>
            <span className="font-mono">{sym} {fmt(agencyCommissionAmount)}</span>
          </div>
        </div>
        <div className="border-t pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Neto</span>
            <span className="font-mono">{sym} {fmt(netAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="font-mono">{sym} {fmt(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total a facturar</span>
            <span className="font-mono">{sym} {fmt(totalInvoice)}</span>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
          Editar importes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <MoneyField label="Gravado 21%" value={fTaxable} onChange={setFTaxable} currency={currency} />
        <MoneyField label="IVA 21%" value={fVatGeneral} onChange={setFVatGeneral} currency={currency} />
        <MoneyField label="Gravado Transp. 10.5%" value={fTransport} onChange={setFTransport} currency={currency} />
        <MoneyField label="IVA 10.5%" value={fVatTransport} onChange={setFVatTransport} currency={currency} />
        <MoneyField label="No Computable" value={fNonComp} onChange={setFNonComp} currency={currency} />
        <MoneyField label="Impuestos" value={fTaxes} onChange={setFTaxes} currency={currency} />
        <MoneyField label="Exento" value={fExempt} onChange={setFExempt} currency={currency} />
        <MoneyField label="Comisión agencia" value={fCommission} onChange={setFCommission} currency={currency} />
      </div>
      <div className="border-t pt-3 grid grid-cols-3 gap-3">
        <MoneyField label="Neto" value={fNet} onChange={setFNet} currency={currency} />
        <MoneyField label="Total" value={fTotal} onChange={setFTotal} currency={currency} />
        <MoneyField label="Total a facturar" value={fTotalInvoice} onChange={setFTotalInvoice} currency={currency} />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
        <Button type="button" size="sm" onClick={save} disabled={pending}>Guardar importes</Button>
      </div>
    </div>
  );
}
