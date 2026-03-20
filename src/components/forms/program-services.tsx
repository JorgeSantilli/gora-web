"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import {
  addProgramHotel, removeProgramHotel,
  addProgramMeal, removeProgramMeal,
  addProgramExcursion, removeProgramExcursion,
  addProgramTransfer, removeProgramTransfer,
  addProgramTicket, removeProgramTicket,
  addProgramRental, removeProgramRental,
  addProgramMisc, removeProgramMisc,
} from "@/actions/programas.actions";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Provider { id: string; fantasyName: string }
interface PensionRegime { id: string; name: string; abbreviation: string }
interface FoodType { id: string; name: string }
interface ExcursionCode { id: string; code: string; name: string }
interface TransferSegment { id: string; code: string; name: string }
interface TicketSegment { id: string; code: string; name: string }

interface Hotel { id: string; provider: Provider; regime: string | null; nights: number; order: number }
interface Meal { id: string; provider: Provider; foodTypeName: string | null; quantity: number }
interface Excursion { id: string; provider: Provider; excursionCodeLabel: string | null }
interface Transfer { id: string; provider: Provider; transferSegmentLabel: string | null }
interface Ticket { id: string; provider: Provider; ticketSegmentLabel: string | null }
interface Rental { id: string; provider: Provider; description: string | null }
interface Misc { id: string; provider: Provider; description: string | null }

interface ProgramServicesProps {
  programId: string;
  agencyId: string;
  hotels: Hotel[];
  meals: Meal[];
  excursions: Excursion[];
  transfers: Transfer[];
  tickets: Ticket[];
  rentals: Rental[];
  miscs: Misc[];
  providers: Provider[];
  pensionRegimes: PensionRegime[];
  foodTypes: FoodType[];
  excursionCodes: ExcursionCode[];
  transferSegments: TransferSegment[];
  ticketSegments: TicketSegment[];
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function ServiceSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <span className="font-medium text-sm">
          {title}
          <span className="ml-2 text-xs text-muted-foreground font-normal">({count})</span>
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

// ─── Remove button ─────────────────────────────────────────────────────────────

function RemoveBtn({ onRemove }: { onRemove: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(onRemove)}
      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

// ─── Provider select helper ────────────────────────────────────────────────────

function ProviderSelect({ value, onChange, providers }: {
  value: string;
  onChange: (v: string) => void;
  providers: Provider[];
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar prestador" />
      </SelectTrigger>
      <SelectContent>
        {providers.map((p) => (
          <SelectItem key={p.id} value={p.id}>{p.fantasyName}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ProgramServices({
  programId, agencyId,
  hotels, meals, excursions, transfers, tickets, rentals, miscs,
  providers, pensionRegimes, foodTypes, excursionCodes, transferSegments, ticketSegments,
}: ProgramServicesProps) {
  const router = useRouter();

  async function run(action: () => Promise<void>) {
    try {
      await action();
      router.refresh();
    } catch {
      toast.error("Error al guardar");
    }
  }

  return (
    <div className="space-y-3">
      {/* ── Hoteles ── */}
      <ServiceSection title="Hoteles" count={hotels.length}>
        {hotels.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left pb-1 font-medium">Prestador</th>
                <th className="text-left pb-1 font-medium">Régimen</th>
                <th className="text-center pb-1 font-medium w-16">Noches</th>
                <th className="text-center pb-1 font-medium w-16">Orden</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {hotels.map((h) => (
                <tr key={h.id} className="border-b last:border-0">
                  <td className="py-1.5">{h.provider.fantasyName}</td>
                  <td className="py-1.5">{h.regime ?? "—"}</td>
                  <td className="py-1.5 text-center">{h.nights}</td>
                  <td className="py-1.5 text-center">{h.order}</td>
                  <td className="py-1.5 text-center">
                    <RemoveBtn onRemove={() => run(() => removeProgramHotel(h.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <HotelAddForm programId={programId} agencyId={agencyId} providers={providers} pensionRegimes={pensionRegimes} onAdd={() => router.refresh()} />
      </ServiceSection>

      {/* ── Comidas ── */}
      <ServiceSection title="Comidas" count={meals.length}>
        {meals.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left pb-1 font-medium">Prestador</th>
                <th className="text-left pb-1 font-medium">Tipo</th>
                <th className="text-center pb-1 font-medium w-20">Cantidad</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {meals.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-1.5">{m.provider.fantasyName}</td>
                  <td className="py-1.5">{m.foodTypeName ?? "—"}</td>
                  <td className="py-1.5 text-center">{m.quantity}</td>
                  <td className="py-1.5 text-center">
                    <RemoveBtn onRemove={() => run(() => removeProgramMeal(m.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <MealAddForm programId={programId} agencyId={agencyId} providers={providers} foodTypes={foodTypes} onAdd={() => router.refresh()} />
      </ServiceSection>

      {/* ── Excursiones ── */}
      <ServiceSection title="Excursiones" count={excursions.length}>
        {excursions.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left pb-1 font-medium">Prestador</th>
                <th className="text-left pb-1 font-medium">Excursión</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {excursions.map((ex) => (
                <tr key={ex.id} className="border-b last:border-0">
                  <td className="py-1.5">{ex.provider.fantasyName}</td>
                  <td className="py-1.5">{ex.excursionCodeLabel ?? "—"}</td>
                  <td className="py-1.5 text-center">
                    <RemoveBtn onRemove={() => run(() => removeProgramExcursion(ex.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <SimpleProviderCodeAddForm
          label="excursión"
          providers={providers}
          codes={excursionCodes.map((c) => ({ id: c.id, label: `${c.code} — ${c.name}` }))}
          codeLabel="Código excursión"
          onAdd={(pid, codeId) => run(() => addProgramExcursion(programId, agencyId, { providerId: pid, excursionCodeId: codeId || undefined }))}
        />
      </ServiceSection>

      {/* ── Traslados ── */}
      <ServiceSection title="Traslados" count={transfers.length}>
        {transfers.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left pb-1 font-medium">Prestador</th>
                <th className="text-left pb-1 font-medium">Tramo</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-1.5">{t.provider.fantasyName}</td>
                  <td className="py-1.5">{t.transferSegmentLabel ?? "—"}</td>
                  <td className="py-1.5 text-center">
                    <RemoveBtn onRemove={() => run(() => removeProgramTransfer(t.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <SimpleProviderCodeAddForm
          label="traslado"
          providers={providers}
          codes={transferSegments.map((s) => ({ id: s.id, label: `${s.code} — ${s.name}` }))}
          codeLabel="Tramo"
          onAdd={(pid, codeId) => run(() => addProgramTransfer(programId, agencyId, { providerId: pid, transferSegmentId: codeId || undefined }))}
        />
      </ServiceSection>

      {/* ── Tickets ── */}
      <ServiceSection title="Tickets / Aéreos" count={tickets.length}>
        {tickets.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left pb-1 font-medium">Prestador</th>
                <th className="text-left pb-1 font-medium">Segmento</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-1.5">{t.provider.fantasyName}</td>
                  <td className="py-1.5">{t.ticketSegmentLabel ?? "—"}</td>
                  <td className="py-1.5 text-center">
                    <RemoveBtn onRemove={() => run(() => removeProgramTicket(t.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <SimpleProviderCodeAddForm
          label="ticket"
          providers={providers}
          codes={ticketSegments.map((s) => ({ id: s.id, label: `${s.code} — ${s.name}` }))}
          codeLabel="Segmento"
          onAdd={(pid, codeId) => run(() => addProgramTicket(programId, agencyId, { providerId: pid, ticketSegmentId: codeId || undefined }))}
        />
      </ServiceSection>

      {/* ── Rentas ── */}
      <ServiceSection title="Rentas / Alquiler de vehículos" count={rentals.length}>
        {rentals.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left pb-1 font-medium">Prestador</th>
                <th className="text-left pb-1 font-medium">Descripción</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rentals.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-1.5">{r.provider.fantasyName}</td>
                  <td className="py-1.5">{r.description ?? "—"}</td>
                  <td className="py-1.5 text-center">
                    <RemoveBtn onRemove={() => run(() => removeProgramRental(r.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <DescriptionAddForm
          label="renta"
          providers={providers}
          onAdd={(providerId, description) => run(() => addProgramRental(programId, agencyId, { providerId, description: description || undefined }))}
        />
      </ServiceSection>

      {/* ── Varios ── */}
      <ServiceSection title="Varios" count={miscs.length}>
        {miscs.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left pb-1 font-medium">Prestador</th>
                <th className="text-left pb-1 font-medium">Descripción</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {miscs.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-1.5">{m.provider.fantasyName}</td>
                  <td className="py-1.5">{m.description ?? "—"}</td>
                  <td className="py-1.5 text-center">
                    <RemoveBtn onRemove={() => run(() => removeProgramMisc(m.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <DescriptionAddForm
          label="item"
          providers={providers}
          onAdd={(providerId, description) => run(() => addProgramMisc(programId, agencyId, { providerId, description: description || undefined }))}
        />
      </ServiceSection>
    </div>
  );
}

// ─── Hotel add form ────────────────────────────────────────────────────────────

function HotelAddForm({ programId, agencyId, providers, pensionRegimes, onAdd }: {
  programId: string; agencyId: string; providers: Provider[];
  pensionRegimes: PensionRegime[]; onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [regime, setRegime] = useState("");
  const [nights, setNights] = useState("1");
  const [order, setOrder] = useState("0");
  const [pending, startTransition] = useTransition();

  function reset() { setProviderId(""); setRegime(""); setNights("1"); setOrder("0"); setOpen(false); }

  function submit() {
    if (!providerId) return toast.error("Seleccioná un prestador");
    startTransition(async () => {
      try {
        await addProgramHotel(programId, agencyId, {
          providerId, regime: regime || undefined,
          nights: Number(nights), order: Number(order),
        });
        onAdd(); reset();
      } catch { toast.error("Error al agregar"); }
    });
  }

  if (!open) return (
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar hotel
    </Button>
  );

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Prestador *</Label>
          <ProviderSelect value={providerId} onChange={setProviderId} providers={providers} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Régimen</Label>
          <Select value={regime} onValueChange={(v) => setRegime(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              {pensionRegimes.map((r) => (
                <SelectItem key={r.id} value={r.abbreviation}>
                  {r.abbreviation} — {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Noches</Label>
          <Input type="number" value={nights} onChange={(e) => setNights(e.target.value)} min={1} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Orden</Label>
          <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} min={0} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}

// ─── Meal add form ─────────────────────────────────────────────────────────────

function MealAddForm({ programId, agencyId, providers, foodTypes, onAdd }: {
  programId: string; agencyId: string; providers: Provider[];
  foodTypes: FoodType[]; onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [foodTypeId, setFoodTypeId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [pending, startTransition] = useTransition();

  function reset() { setProviderId(""); setFoodTypeId(""); setQuantity("1"); setOpen(false); }

  function submit() {
    if (!providerId) return toast.error("Seleccioná un prestador");
    startTransition(async () => {
      try {
        await addProgramMeal(programId, agencyId, {
          providerId, foodTypeId: foodTypeId || undefined, quantity: Number(quantity),
        });
        onAdd(); reset();
      } catch { toast.error("Error al agregar"); }
    });
  }

  if (!open) return (
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar comida
    </Button>
  );

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Prestador *</Label>
          <ProviderSelect value={providerId} onChange={setProviderId} providers={providers} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo de comida</Label>
          <Select value={foodTypeId} onValueChange={(v) => setFoodTypeId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              {foodTypes.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Cantidad</Label>
        <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min={1} className="max-w-xs" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}

// ─── Generic: provider + code select ──────────────────────────────────────────

function SimpleProviderCodeAddForm({ label, providers, codes, codeLabel, onAdd }: {
  label: string;
  providers: Provider[];
  codes: { id: string; label: string }[];
  codeLabel: string;
  onAdd: (providerId: string, codeId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [codeId, setCodeId] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() { setProviderId(""); setCodeId(""); setOpen(false); }

  function submit() {
    if (!providerId) return toast.error("Seleccioná un prestador");
    startTransition(async () => {
      try {
        await onAdd(providerId, codeId);
        reset();
      } catch { toast.error("Error al agregar"); }
    });
  }

  if (!open) return (
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar {label}
    </Button>
  );

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Prestador *</Label>
          <ProviderSelect value={providerId} onChange={setProviderId} providers={providers} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{codeLabel}</Label>
          <Select value={codeId} onValueChange={(v) => setCodeId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              {codes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}

// ─── Generic: provider + description ──────────────────────────────────────────

function DescriptionAddForm({ label, providers, onAdd }: {
  label: string;
  providers: Provider[];
  onAdd: (providerId: string, description: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() { setProviderId(""); setDescription(""); setOpen(false); }

  function submit() {
    if (!providerId) return toast.error("Seleccioná un prestador");
    startTransition(async () => {
      try {
        await onAdd(providerId, description);
        reset();
      } catch { toast.error("Error al agregar"); }
    });
  }

  if (!open) return (
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar {label}
    </Button>
  );

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Prestador *</Label>
          <ProviderSelect value={providerId} onChange={setProviderId} providers={providers} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Descripción</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}
