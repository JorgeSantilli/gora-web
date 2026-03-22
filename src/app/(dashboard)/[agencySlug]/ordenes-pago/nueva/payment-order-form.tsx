"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { createPaymentOrder, getPendingPurchaseInvoicesByProvider } from "@/actions/ordenes-pago.actions";
import { nanoid } from "nanoid";

interface Provider { id: string; fantasyName: string; }

interface PendingInvoice {
  id:       string;
  type:     string;
  number:   string;
  date:     Date;
  total:    unknown;
  balance:  unknown;
  currency: string;
}

interface OPItemRow {
  _id:       string;
  invoiceId: string;
  amount:    string;
  maxAmount: number;
  label:     string;
}

interface CheckRow {
  _id:          string;
  number:       string;
  bank:         string;
  accountNumber:string;
  issuedAt:     string;
  deferredDate: string;
  beneficiary:  string;
  amount:       string;
}

function fmt(n: unknown) {
  return parseFloat(String(n)).toLocaleString("es-AR", { minimumFractionDigits: 2 });
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const ORIGINS = ["AdminCobranza", "Facturación", "Dirección", "Varios"];

interface Props {
  agencyId:   string;
  agencySlug: string;
  userName:   string;
  providers:  Provider[];
}

export function PaymentOrderForm({ agencyId, agencySlug, userName, providers }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [date,         setDate]         = useState(today);
  const [providerId,   setProviderId]   = useState("");
  const [currency,     setCurrency]     = useState("PESOS");
  const [exchangeRate, setExchangeRate] = useState("");
  const [concept,      setConcept]      = useState("");
  const [origin,       setOrigin]       = useState("AdminCobranza");

  const [pendingInvoices,  setPendingInvoices]  = useState<PendingInvoice[]>([]);
  const [loadingInvoices,  setLoadingInvoices]  = useState(false);
  const [items,   setItems]   = useState<OPItemRow[]>([]);
  const [checks,  setChecks]  = useState<CheckRow[]>([]);

  const totalItems  = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const totalChecks = checks.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const cashAmount  = Math.max(totalItems - totalChecks, 0);
  const symbol      = currency === "USD" ? "u$s" : "$";

  useEffect(() => {
    if (!providerId) { setPendingInvoices([]); setItems([]); return; }
    setLoadingInvoices(true);
    getPendingPurchaseInvoicesByProvider(agencyId, providerId, currency)
      .then((invs) => { setPendingInvoices(invs as PendingInvoice[]); setItems([]); })
      .finally(() => setLoadingInvoices(false));
  }, [providerId, currency, agencyId]);

  function toggleInvoice(inv: PendingInvoice) {
    const exists = items.find((i) => i.invoiceId === inv.id);
    if (exists) {
      setItems((prev) => prev.filter((i) => i.invoiceId !== inv.id));
    } else {
      const bal = parseFloat(String(inv.balance));
      setItems((prev) => [...prev, {
        _id: nanoid(), invoiceId: inv.id,
        amount: bal.toFixed(2), maxAmount: bal,
        label: `${inv.type}-${inv.number}`,
      }]);
    }
  }

  function addCheck() {
    setChecks((prev) => [...prev, {
      _id: nanoid(), number: "", bank: "", accountNumber: "",
      issuedAt: today, deferredDate: "", beneficiary: "", amount: "",
    }]);
  }
  function updateCheck(_id: string, field: keyof Omit<CheckRow, "_id">, value: string) {
    setChecks((prev) => prev.map((c) => c._id === _id ? { ...c, [field]: value } : c));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createPaymentOrder(agencyId, agencySlug, userName, {
          providerId,
          date,
          currency,
          exchangeRate:  exchangeRate ? parseFloat(exchangeRate) : null,
          concept:       concept || null,
          origin:        origin || null,
          items:         items.map((i) => ({ purchaseInvoiceId: i.invoiceId, amount: parseFloat(i.amount) })),
          checks:        checks.map((c) => ({
            number:        c.number,
            bank:          c.bank || null,
            accountNumber: c.accountNumber || null,
            issuedAt:      c.issuedAt || null,
            deferredDate:  c.deferredDate || null,
            beneficiary:   c.beneficiary || null,
            amount:        parseFloat(c.amount),
          })),
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al crear la orden");
      }
    });
  }

  const canSubmit = providerId && items.length > 0 && totalItems > 0 && !isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">

      {/* Datos base */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold text-sm">Datos de la orden</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Fecha</Label>
            <Input type="date" className="h-8 text-sm" value={date}
              onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Prestador</Label>
            <Select value={providerId} onValueChange={(v) => setProviderId(v ?? "")}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Seleccionar prestador..." />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.fantasyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Moneda</Label>
            <Select value={currency} onValueChange={(v) => { setCurrency(v ?? "PESOS"); setItems([]); }}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PESOS">PESOS</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {currency === "USD" && (
            <div className="space-y-1">
              <Label className="text-xs">Tipo de cambio</Label>
              <Input className="h-8 text-sm font-mono" type="number" step="0.01"
                value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Origen</Label>
            <Select value={origin} onValueChange={(v) => setOrigin(v ?? "AdminCobranza")}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORIGINS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Concepto (opcional)</Label>
            <Input className="h-8 text-sm" placeholder="Cancelación facturas varias..."
              value={concept} onChange={(e) => setConcept(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Facturas pendientes */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold text-sm">Facturas a cancelar</h2>
        {!providerId && (
          <p className="text-sm text-muted-foreground">Seleccione un prestador para ver sus facturas pendientes.</p>
        )}
        {providerId && loadingInvoices && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
          </div>
        )}
        {providerId && !loadingInvoices && pendingInvoices.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay facturas pendientes en {currency} para este prestador.</p>
        )}
        {pendingInvoices.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Número</TableHead>
                  <TableHead className="w-24 text-center">Fecha</TableHead>
                  <TableHead className="text-right w-32">Total</TableHead>
                  <TableHead className="text-right w-32">Saldo</TableHead>
                  <TableHead className="text-right w-36">A pagar ({symbol})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvoices.map((inv) => {
                  const selected = items.find((i) => i.invoiceId === inv.id);
                  return (
                    <TableRow key={inv.id} className={selected ? "bg-primary/5" : undefined}>
                      <TableCell>
                        <input type="checkbox" className="h-4 w-4 cursor-pointer"
                          checked={!!selected} onChange={() => toggleInvoice(inv)} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{inv.type}-{inv.number}</TableCell>
                      <TableCell className="text-center text-sm">{fmtDate(inv.date)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{symbol} {fmt(inv.total)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-amber-600">{symbol} {fmt(inv.balance)}</TableCell>
                      <TableCell className="text-right">
                        {selected ? (
                          <Input type="number" step="0.01" min="0.01" max={selected.maxAmount}
                            className="h-7 text-sm font-mono text-right w-32 ml-auto"
                            value={selected.amount}
                            onChange={(e) => setItems((prev) =>
                              prev.map((i) => i._id === selected._id ? { ...i, amount: e.target.value } : i)
                            )} />
                        ) : <span className="text-sm text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {items.length > 0 && (
          <div className="flex justify-end text-sm font-medium">
            Total a pagar: <span className="font-mono font-bold ml-2">{symbol} {fmt(totalItems)}</span>
          </div>
        )}
      </div>

      {/* Forma de pago */}
      {items.length > 0 && (
        <div className="rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold text-sm">Forma de pago</h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cheques propios emitidos</h3>
              <Button type="button" size="sm" variant="outline" onClick={addCheck}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Agregar cheque
              </Button>
            </div>
            {checks.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin cheques — pago en efectivo.</p>
            )}
            {checks.map((c) => (
              <div key={c._id} className="grid grid-cols-4 md:grid-cols-8 gap-2 items-end border rounded-md p-2">
                <div className="space-y-1">
                  <Label className="text-xs">Número *</Label>
                  <Input className="h-7 text-sm" value={c.number}
                    onChange={(e) => updateCheck(c._id, "number", e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Banco</Label>
                  <Input className="h-7 text-sm" value={c.bank}
                    onChange={(e) => updateCheck(c._id, "bank", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cuenta</Label>
                  <Input className="h-7 text-sm" value={c.accountNumber}
                    onChange={(e) => updateCheck(c._id, "accountNumber", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Beneficiario</Label>
                  <Input className="h-7 text-sm" value={c.beneficiary}
                    onChange={(e) => updateCheck(c._id, "beneficiary", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Emisión</Label>
                  <Input type="date" className="h-7 text-sm" value={c.issuedAt}
                    onChange={(e) => updateCheck(c._id, "issuedAt", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Diferido</Label>
                  <Input type="date" className="h-7 text-sm" value={c.deferredDate}
                    onChange={(e) => updateCheck(c._id, "deferredDate", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Importe *</Label>
                  <Input type="number" step="0.01" min="0.01" className="h-7 text-sm font-mono"
                    value={c.amount} onChange={(e) => updateCheck(c._id, "amount", e.target.value)} required />
                </div>
                <div className="flex items-end">
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                    onClick={() => setChecks((prev) => prev.filter((x) => x._id !== c._id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div className="rounded-md bg-muted/30 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total a pagar</span>
              <span className="font-mono font-medium">{symbol} {fmt(totalItems)}</span>
            </div>
            {totalChecks > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cheques</span>
                <span className="font-mono">— {symbol} {fmt(totalChecks)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Efectivo</span>
              <span className="font-mono">{symbol} {fmt(cashAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={!canSubmit}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Emitir Orden de Pago
        </Button>
        <Button type="button" variant="ghost"
          render={<a href={`/${agencySlug}/ordenes-pago`} />}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
