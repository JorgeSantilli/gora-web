"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, X } from "lucide-react";
import { addCashTransaction } from "@/actions/caja.actions";
import { useRouter } from "next/navigation";

const ORIGINS = [
  "Facturación", "AdminCobranza", "Cuentas Corrientes", "Banco", "Varios",
];

const VOUCHER_TYPES_IN  = ["Recibo", "Efectivo", "Transferencia", "Cheque", "Depósito", "Otro"];
const VOUCHER_TYPES_OUT = ["Pago", "Efectivo", "Transferencia", "Cheque", "Gasto", "Otro"];

interface Props {
  dailyCashId: string;
  agencyId:    string;
  agencySlug:  string;
  currency:    string;
}

const empty = {
  direction:     "IN" as "IN" | "OUT",
  origin:        "",
  voucherType:   "",
  voucherNumber: "",
  amount:        "",
  description:   "",
  accountEntry:  "",
};

export function AddTransactionForm({ dailyCashId, agencyId, agencySlug, currency }: Props) {
  const [open, setOpen]               = useState(false);
  const [form, setForm]               = useState(empty);
  const [isPending, startTransition]  = useTransition();
  const [error, setError]             = useState<string | null>(null);
  const router = useRouter();

  const symbol      = currency === "USD" ? "u$s" : "$";
  const voucherOpts = form.direction === "IN" ? VOUCHER_TYPES_IN : VOUCHER_TYPES_OUT;

  function set(field: keyof typeof empty, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "direction") {
      setForm((prev) => ({ ...prev, direction: value as "IN" | "OUT", voucherType: "" }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addCashTransaction(dailyCashId, agencyId, agencySlug, {
          direction:     form.direction,
          origin:        form.origin,
          voucherType:   form.voucherType,
          voucherNumber: form.voucherNumber || null,
          amount:        parseFloat(form.amount),
          description:   form.description || null,
          accountEntry:  form.accountEntry || null,
        });
        setForm(empty);
        setOpen(false);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al agregar el movimiento");
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" /> Agregar movimiento manual
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Nuevo movimiento manual</h3>
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
          onClick={() => { setOpen(false); setError(null); setForm(empty); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Dirección */}
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={form.direction} onValueChange={(v) => set("direction", v ?? "IN")}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN">Ingreso</SelectItem>
              <SelectItem value="OUT">Egreso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Origen */}
        <div className="space-y-1">
          <Label className="text-xs">Origen</Label>
          <Select value={form.origin} onValueChange={(v) => set("origin", v ?? "")}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {ORIGINS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo comprobante */}
        <div className="space-y-1">
          <Label className="text-xs">Comprobante</Label>
          <Select value={form.voucherType} onValueChange={(v) => set("voucherType", v ?? "")}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {voucherOpts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Número comprobante */}
        <div className="space-y-1">
          <Label className="text-xs">Número (opcional)</Label>
          <Input
            className="h-8 text-sm"
            placeholder="Ej: 00001234"
            value={form.voucherNumber}
            onChange={(e) => set("voucherNumber", e.target.value)}
          />
        </div>

        {/* Importe */}
        <div className="space-y-1">
          <Label className="text-xs">Importe ({symbol})</Label>
          <Input
            className="h-8 text-sm font-mono"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            required
          />
        </div>

        {/* Imputación contable */}
        <div className="space-y-1">
          <Label className="text-xs">Imputación (opcional)</Label>
          <Input
            className="h-8 text-sm"
            placeholder="Código contable"
            value={form.accountEntry}
            onChange={(e) => set("accountEntry", e.target.value)}
          />
        </div>

        {/* Descripción — ancho completo */}
        <div className="space-y-1 col-span-2 md:col-span-3">
          <Label className="text-xs">Descripción (opcional)</Label>
          <Input
            className="h-8 text-sm"
            placeholder="Detalle del movimiento"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || !form.origin || !form.voucherType || !form.amount}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Agregar
        </Button>
        <Button type="button" size="sm" variant="ghost"
          onClick={() => { setOpen(false); setError(null); setForm(empty); }}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
