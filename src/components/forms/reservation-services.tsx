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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import {
  addPassenger, removePassenger,
  addAccommodation, removeAccommodation,
  addRoom, removeRoom,
  addMeal, removeMeal,
  addExcursion, removeExcursion,
  addTransfer, removeTransfer,
  addTicket, removeTicket,
  addRental, removeRental,
  addMisc, removeMisc,
} from "@/actions/reservas.actions";

// ─── Lookup types ──────────────────────────────────────────────────────────────

interface Provider { id: string; fantasyName: string }
interface RoomType { id: string; code: string; name: string; abbreviation: string }
interface FoodType { id: string; name: string }
interface ExcursionCode { id: string; code: string; name: string }
interface TransferSegment { id: string; code: string; name: string }
interface TicketSegment { id: string; code: string; name: string }
interface PensionRegime { id: string; name: string; abbreviation: string }

// ─── Entity types ──────────────────────────────────────────────────────────────

interface Passenger {
  id: string; name: string; docType: string | null; docNumber: string | null;
  nationality: string | null; occupation: string | null; order: number;
}
interface Room {
  id: string; roomTypeId: string | null; quantity: number;
  isCommunicating: boolean; isFree: boolean;
}
interface Accommodation {
  id: string; provider: Provider;
  checkIn: Date; checkOut: Date; regime: string | null;
  confirmedWith: string | null; confirmedAt: Date | null;
  rooms: Room[];
}
interface Meal {
  id: string; provider: Provider; foodTypeId: string | null;
  quantity: number; quantityPerPax: number; date: Date | null;
}
interface Excursion {
  id: string; provider: Provider; excursionCodeId: string | null;
  date: Date; time: string | null; pickupProviderId: string | null;
  pickupOther: string | null; guideType: string | null;
  isPrivate: boolean; paxCount: number;
}
interface Transfer {
  id: string; provider: Provider; transferSegmentId: string | null;
  date: Date; time: string | null; medium: string | null;
  pickupProviderId: string | null; pickupOther: string | null;
  guideType: string | null; isPrivate: boolean; paxCount: number;
}
interface Ticket {
  id: string; provider: Provider; ticketSegmentId: string | null;
  date: Date; passengerName: string | null;
  passengerType: "ADULT" | "CHILD" | "INFANT";
  ticketNumber: string | null; issuedAt: Date | null;
}
interface Rental {
  id: string; provider: Provider; vehicleDesc: string | null;
  pickupAt: Date | null; pickupTime: string | null;
  pickupPlace: string | null; pickupMedium: string | null;
  dropoffAt: Date | null; dropoffTime: string | null;
  dropoffPlace: string | null; dropoffMedium: string | null;
}
interface Misc {
  id: string; provider: Provider; description: string;
  vatType: string;
}

interface ReservationServicesProps {
  reservationId: string;
  agencyId: string;
  passengers: Passenger[];
  accommodations: Accommodation[];
  meals: Meal[];
  excursions: Excursion[];
  transfers: Transfer[];
  tickets: Ticket[];
  rentals: Rental[];
  miscs: Misc[];
  providers: Provider[];
  roomTypes: RoomType[];
  foodTypes: FoodType[];
  excursionCodes: ExcursionCode[];
  transferSegments: TransferSegment[];
  ticketSegments: TicketSegment[];
  pensionRegimes: PensionRegime[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(date: Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

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

function RemoveBtn({ onRemove }: { onRemove: () => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button" disabled={pending}
      onClick={() => start(onRemove)}
      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function ProviderSelect({ value, onChange, providers }: { value: string; onChange: (v: string) => void; providers: Provider[] }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger><SelectValue placeholder="Seleccionar prestador" /></SelectTrigger>
      <SelectContent>
        {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.fantasyName}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ReservationServices({
  reservationId, agencyId,
  passengers, accommodations, meals, excursions, transfers, tickets, rentals, miscs,
  providers, roomTypes, foodTypes, excursionCodes, transferSegments, ticketSegments, pensionRegimes,
}: ReservationServicesProps) {
  const router = useRouter();

  async function run(action: () => Promise<void>) {
    try { await action(); router.refresh(); }
    catch { toast.error("Error al guardar"); }
  }

  return (
    <div className="space-y-3">

      {/* ── Pasajeros ── */}
      <ServiceSection title="Pasajeros" count={passengers.length}>
        {passengers.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left pb-1 font-medium">Nombre</th>
                <th className="text-left pb-1 font-medium">Doc.</th>
                <th className="text-left pb-1 font-medium">Nac.</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {passengers.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-1.5 font-medium">{p.name}</td>
                  <td className="py-1.5 text-muted-foreground">
                    {p.docType && p.docNumber ? `${p.docType} ${p.docNumber}` : "—"}
                  </td>
                  <td className="py-1.5">{p.nationality ?? "—"}</td>
                  <td className="py-1.5 text-center">
                    <RemoveBtn onRemove={() => run(() => removePassenger(p.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <PassengerAddForm reservationId={reservationId} agencyId={agencyId} onAdd={() => router.refresh()} />
      </ServiceSection>

      {/* ── Alojamientos ── */}
      <ServiceSection title="Alojamientos" count={accommodations.length}>
        {accommodations.length > 0 && (
          <div className="space-y-3">
            {accommodations.map((acc) => (
              <div key={acc.id} className="border rounded-md p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{acc.provider.fantasyName}</div>
                    <div className="text-xs text-muted-foreground">
                      {fmt(acc.checkIn)} → {fmt(acc.checkOut)}
                      {acc.regime && <span className="ml-2 font-medium">{acc.regime}</span>}
                    </div>
                    {acc.confirmedWith && (
                      <div className="text-xs text-muted-foreground">Confirmado con: {acc.confirmedWith}</div>
                    )}
                  </div>
                  <RemoveBtn onRemove={() => run(() => removeAccommodation(acc.id))} />
                </div>
                {/* Habitaciones */}
                {acc.rooms.length > 0 && (
                  <div className="ml-2 border-l-2 border-muted pl-3 space-y-1">
                    {acc.rooms.map((room) => {
                      const rt = roomTypes.find((r) => r.id === room.roomTypeId);
                      return (
                        <div key={room.id} className="flex items-center justify-between text-xs">
                          <span>
                            {room.quantity}x {rt ? `${rt.abbreviation} — ${rt.name}` : "Habitación"}
                            {room.isCommunicating && <span className="ml-1 text-muted-foreground">(comunic.)</span>}
                            {room.isFree && <span className="ml-1 text-blue-600">(cortesía)</span>}
                          </span>
                          <RemoveBtn onRemove={() => run(() => removeRoom(room.id))} />
                        </div>
                      );
                    })}
                  </div>
                )}
                <RoomAddForm accommodationId={acc.id} roomTypes={roomTypes} onAdd={() => router.refresh()} />
              </div>
            ))}
          </div>
        )}
        <AccommodationAddForm reservationId={reservationId} agencyId={agencyId} providers={providers} pensionRegimes={pensionRegimes} onAdd={() => router.refresh()} />
      </ServiceSection>

      {/* ── Comidas ── */}
      <ServiceSection title="Comidas" count={meals.length}>
        {meals.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left pb-1 font-medium">Prestador</th>
                <th className="text-left pb-1 font-medium">Tipo</th>
                <th className="text-center pb-1 font-medium w-16">Cant.</th>
                <th className="text-center pb-1 font-medium w-16">c/pax</th>
                <th className="text-left pb-1 font-medium">Fecha</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {meals.map((m) => {
                const ft = foodTypes.find((f) => f.id === m.foodTypeId);
                return (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-1.5">{m.provider.fantasyName}</td>
                    <td className="py-1.5">{ft?.name ?? "—"}</td>
                    <td className="py-1.5 text-center">{m.quantity}</td>
                    <td className="py-1.5 text-center">{m.quantityPerPax}</td>
                    <td className="py-1.5">{fmt(m.date)}</td>
                    <td className="py-1.5 text-center">
                      <RemoveBtn onRemove={() => run(() => removeMeal(m.id))} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <MealAddForm reservationId={reservationId} agencyId={agencyId} providers={providers} foodTypes={foodTypes} onAdd={() => router.refresh()} />
      </ServiceSection>

      {/* ── Excursiones ── */}
      <ServiceSection title="Excursiones" count={excursions.length}>
        {excursions.length > 0 && (
          <div className="space-y-2">
            {excursions.map((ex) => {
              const ec = excursionCodes.find((c) => c.id === ex.excursionCodeId);
              const pickup = providers.find((p) => p.id === ex.pickupProviderId);
              return (
                <div key={ex.id} className="border rounded-md p-3 flex items-start justify-between">
                  <div className="space-y-0.5 text-sm">
                    <div className="font-medium">{ex.provider.fantasyName}</div>
                    {ec && <div className="text-xs text-muted-foreground">{ec.code} — {ec.name}</div>}
                    <div className="text-xs text-muted-foreground">
                      {fmt(ex.date)}{ex.time && ` ${ex.time}`}
                      {ex.isPrivate && <span className="ml-2 text-blue-600">Privada</span>}
                      <span className="ml-2">{ex.paxCount} pax</span>
                    </div>
                    {(pickup || ex.pickupOther) && (
                      <div className="text-xs text-muted-foreground">
                        Búsqueda: {pickup ? pickup.fantasyName : ex.pickupOther}
                      </div>
                    )}
                  </div>
                  <RemoveBtn onRemove={() => run(() => removeExcursion(ex.id))} />
                </div>
              );
            })}
          </div>
        )}
        <ExcursionAddForm reservationId={reservationId} agencyId={agencyId} providers={providers} excursionCodes={excursionCodes} onAdd={() => router.refresh()} />
      </ServiceSection>

      {/* ── Traslados ── */}
      <ServiceSection title="Traslados" count={transfers.length}>
        {transfers.length > 0 && (
          <div className="space-y-2">
            {transfers.map((t) => {
              const seg = transferSegments.find((s) => s.id === t.transferSegmentId);
              const pickup = providers.find((p) => p.id === t.pickupProviderId);
              return (
                <div key={t.id} className="border rounded-md p-3 flex items-start justify-between">
                  <div className="space-y-0.5 text-sm">
                    <div className="font-medium">{t.provider.fantasyName}</div>
                    {seg && <div className="text-xs text-muted-foreground">{seg.code} — {seg.name}</div>}
                    <div className="text-xs text-muted-foreground">
                      {fmt(t.date)}{t.time && ` ${t.time}`}
                      {t.medium && <span className="ml-2">{t.medium}</span>}
                      {t.isPrivate && <span className="ml-2 text-blue-600">Privado</span>}
                      <span className="ml-2">{t.paxCount} pax</span>
                    </div>
                    {(pickup || t.pickupOther) && (
                      <div className="text-xs text-muted-foreground">
                        Origen: {pickup ? pickup.fantasyName : t.pickupOther}
                      </div>
                    )}
                  </div>
                  <RemoveBtn onRemove={() => run(() => removeTransfer(t.id))} />
                </div>
              );
            })}
          </div>
        )}
        <TransferAddForm reservationId={reservationId} agencyId={agencyId} providers={providers} transferSegments={transferSegments} onAdd={() => router.refresh()} />
      </ServiceSection>

      {/* ── Tickets ── */}
      <ServiceSection title="Tickets / Aéreos" count={tickets.length}>
        {tickets.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left pb-1 font-medium">Prestador</th>
                <th className="text-left pb-1 font-medium">Segmento</th>
                <th className="text-left pb-1 font-medium">Pasajero</th>
                <th className="text-left pb-1 font-medium">Tipo</th>
                <th className="text-left pb-1 font-medium">Fecha</th>
                <th className="text-left pb-1 font-medium">N° Ticket</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const seg = ticketSegments.find((s) => s.id === t.ticketSegmentId);
                const paxLabels = { ADULT: "Adulto", CHILD: "Menor", INFANT: "Bebé" };
                return (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-1.5">{t.provider.fantasyName}</td>
                    <td className="py-1.5">{seg ? `${seg.code}` : "—"}</td>
                    <td className="py-1.5">{t.passengerName ?? "—"}</td>
                    <td className="py-1.5">{paxLabels[t.passengerType]}</td>
                    <td className="py-1.5">{fmt(t.date)}</td>
                    <td className="py-1.5 font-mono text-xs">{t.ticketNumber ?? "—"}</td>
                    <td className="py-1.5 text-center">
                      <RemoveBtn onRemove={() => run(() => removeTicket(t.id))} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <TicketAddForm reservationId={reservationId} agencyId={agencyId} providers={providers} ticketSegments={ticketSegments} onAdd={() => router.refresh()} />
      </ServiceSection>

      {/* ── Rentas ── */}
      <ServiceSection title="Alquiler de Vehículos" count={rentals.length}>
        {rentals.length > 0 && (
          <div className="space-y-2">
            {rentals.map((r) => (
              <div key={r.id} className="border rounded-md p-3 flex items-start justify-between">
                <div className="space-y-0.5 text-sm">
                  <div className="font-medium">{r.provider.fantasyName}</div>
                  {r.vehicleDesc && <div className="text-xs text-muted-foreground">{r.vehicleDesc}</div>}
                  <div className="text-xs text-muted-foreground">
                    Retiro: {fmt(r.pickupAt)}{r.pickupTime && ` ${r.pickupTime}`}
                    {r.pickupPlace && ` — ${r.pickupPlace}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dev.: {fmt(r.dropoffAt)}{r.dropoffTime && ` ${r.dropoffTime}`}
                    {r.dropoffPlace && ` — ${r.dropoffPlace}`}
                  </div>
                </div>
                <RemoveBtn onRemove={() => run(() => removeRental(r.id))} />
              </div>
            ))}
          </div>
        )}
        <RentalAddForm reservationId={reservationId} agencyId={agencyId} providers={providers} onAdd={() => router.refresh()} />
      </ServiceSection>

      {/* ── Varios ── */}
      <ServiceSection title="Varios / Servicios adicionales" count={miscs.length}>
        {miscs.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b">
                <th className="text-left pb-1 font-medium">Prestador</th>
                <th className="text-left pb-1 font-medium">Descripción</th>
                <th className="text-left pb-1 font-medium">IVA</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {miscs.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-1.5">{m.provider.fantasyName}</td>
                  <td className="py-1.5">{m.description}</td>
                  <td className="py-1.5 text-xs text-muted-foreground">{m.vatType}</td>
                  <td className="py-1.5 text-center">
                    <RemoveBtn onRemove={() => run(() => removeMisc(m.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <MiscAddForm reservationId={reservationId} agencyId={agencyId} providers={providers} onAdd={() => router.refresh()} />
      </ServiceSection>

    </div>
  );
}

// ─── Add form: Passenger ───────────────────────────────────────────────────────

function PassengerAddForm({ reservationId, agencyId, onAdd }: { reservationId: string; agencyId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [occupation, setOccupation] = useState("");
  const [pending, start] = useTransition();

  function reset() { setName(""); setDocType(""); setDocNumber(""); setNationality(""); setOccupation(""); setOpen(false); }

  function submit() {
    if (!name.trim()) return toast.error("Ingresá el nombre");
    start(async () => {
      try {
        await addPassenger(reservationId, agencyId, {
          name, docType: docType || undefined, docNumber: docNumber || undefined,
          nationality: nationality || undefined, occupation: occupation || undefined, order: 0,
        });
        onAdd(); reset();
      } catch { toast.error("Error al agregar"); }
    });
  }

  if (!open) return (
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar pasajero
    </Button>
  );

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Nombre completo *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="GARCIA, JUAN" maxLength={120} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo doc.</Label>
          <Select value={docType} onValueChange={(v) => setDocType(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              <SelectItem value="DNI">DNI</SelectItem>
              <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
              <SelectItem value="LE">LE</SelectItem>
              <SelectItem value="LC">LC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">N° documento</Label>
          <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} maxLength={20} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nacionalidad</Label>
          <Input value={nationality} onChange={(e) => setNationality(e.target.value)} maxLength={40} placeholder="Argentina" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ocupación</Label>
          <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} maxLength={60} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}

// ─── Add form: Accommodation ───────────────────────────────────────────────────

function AccommodationAddForm({ reservationId, agencyId, providers, pensionRegimes, onAdd }: {
  reservationId: string; agencyId: string; providers: Provider[];
  pensionRegimes: PensionRegime[]; onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [regime, setRegime] = useState("");
  const [confirmedWith, setConfirmedWith] = useState("");
  const [pending, start] = useTransition();

  function reset() { setProviderId(""); setCheckIn(""); setCheckOut(""); setRegime(""); setConfirmedWith(""); setOpen(false); }

  function submit() {
    if (!providerId) return toast.error("Seleccioná un hotel");
    if (!checkIn || !checkOut) return toast.error("Ingresá las fechas");
    start(async () => {
      try {
        await addAccommodation(reservationId, agencyId, {
          providerId, checkIn, checkOut,
          regime: regime || undefined, confirmedWith: confirmedWith || undefined,
        });
        onAdd(); reset();
      } catch { toast.error("Error al agregar"); }
    });
  }

  if (!open) return (
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar alojamiento
    </Button>
  );

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="space-y-1">
        <Label className="text-xs">Hotel *</Label>
        <ProviderSelect value={providerId} onChange={setProviderId} providers={providers} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Check-in *</Label>
          <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Check-out *</Label>
          <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Régimen de pensión</Label>
          <Select value={regime} onValueChange={(v) => setRegime(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
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
        <div className="space-y-1">
          <Label className="text-xs">Confirmado con</Label>
          <Input value={confirmedWith} onChange={(e) => setConfirmedWith(e.target.value)} maxLength={80} placeholder="Nombre contacto..." />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}

// ─── Add form: Room ────────────────────────────────────────────────────────────

function RoomAddForm({ accommodationId, roomTypes, onAdd }: {
  accommodationId: string; roomTypes: RoomType[]; onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [roomTypeId, setRoomTypeId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isCommunicating, setIsCommunicating] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [pending, start] = useTransition();

  function reset() { setRoomTypeId(""); setQuantity("1"); setIsCommunicating(false); setIsFree(false); setOpen(false); }

  function submit() {
    start(async () => {
      try {
        await addRoom(accommodationId, {
          roomTypeId: roomTypeId || undefined,
          quantity: Number(quantity), isCommunicating, isFree,
        });
        onAdd(); reset();
      } catch { toast.error("Error al agregar"); }
    });
  }

  if (!open) return (
    <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar habitación
    </Button>
  );

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/10">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Tipo de habitación</Label>
          <Select value={roomTypeId} onValueChange={(v) => setRoomTypeId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              {roomTypes.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.abbreviation} — {r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cantidad</Label>
          <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min={1} />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={isCommunicating} onCheckedChange={setIsCommunicating} />
          <Label className="text-xs">Comunicadas</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isFree} onCheckedChange={setIsFree} />
          <Label className="text-xs">Cortesía</Label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}

// ─── Add form: Meal ────────────────────────────────────────────────────────────

function MealAddForm({ reservationId, agencyId, providers, foodTypes, onAdd }: {
  reservationId: string; agencyId: string;
  providers: Provider[]; foodTypes: FoodType[]; onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [foodTypeId, setFoodTypeId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [quantityPerPax, setQuantityPerPax] = useState("1");
  const [date, setDate] = useState("");
  const [pending, start] = useTransition();

  function reset() { setProviderId(""); setFoodTypeId(""); setQuantity("1"); setQuantityPerPax("1"); setDate(""); setOpen(false); }

  function submit() {
    if (!providerId) return toast.error("Seleccioná un prestador");
    start(async () => {
      try {
        await addMeal(reservationId, agencyId, {
          providerId, foodTypeId: foodTypeId || undefined,
          quantity: Number(quantity), quantityPerPax: Number(quantityPerPax),
          date: date || undefined,
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
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              {foodTypes.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Cantidad</Label>
          <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min={1} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">c/ pax</Label>
          <Input type="number" value={quantityPerPax} onChange={(e) => setQuantityPerPax(e.target.value)} min={1} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Fecha</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}

// ─── Add form: Excursion ───────────────────────────────────────────────────────

function ExcursionAddForm({ reservationId, agencyId, providers, excursionCodes, onAdd }: {
  reservationId: string; agencyId: string;
  providers: Provider[]; excursionCodes: ExcursionCode[]; onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [excursionCodeId, setExcursionCodeId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [pickupProviderId, setPickupProviderId] = useState("");
  const [pickupOther, setPickupOther] = useState("");
  const [guideType, setGuideType] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [paxCount, setPaxCount] = useState("1");
  const [pending, start] = useTransition();

  function reset() {
    setProviderId(""); setExcursionCodeId(""); setDate(""); setTime("");
    setPickupProviderId(""); setPickupOther(""); setGuideType(""); setIsPrivate(false); setPaxCount("1"); setOpen(false);
  }

  function submit() {
    if (!providerId) return toast.error("Seleccioná un prestador");
    if (!date) return toast.error("Ingresá la fecha");
    start(async () => {
      try {
        await addExcursion(reservationId, agencyId, {
          providerId, excursionCodeId: excursionCodeId || undefined, date,
          time: time || undefined, pickupProviderId: pickupProviderId || undefined,
          pickupOther: pickupOther || undefined, guideType: guideType || undefined,
          isPrivate, paxCount: Number(paxCount),
        });
        onAdd(); reset();
      } catch { toast.error("Error al agregar"); }
    });
  }

  if (!open) return (
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar excursión
    </Button>
  );

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Operadora *</Label>
          <ProviderSelect value={providerId} onChange={setProviderId} providers={providers} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Excursión</Label>
          <Select value={excursionCodeId} onValueChange={(v) => setExcursionCodeId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              {excursionCodes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Fecha *</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Horario</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pax</Label>
          <Input type="number" value={paxCount} onChange={(e) => setPaxCount(e.target.value)} min={1} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Búsqueda en hotel</Label>
          <ProviderSelect value={pickupProviderId} onChange={setPickupProviderId} providers={providers} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Búsqueda otro lugar</Label>
          <Input value={pickupOther} onChange={(e) => setPickupOther(e.target.value)} maxLength={100} placeholder="Dirección..." />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Tipo de guía</Label>
          <Select value={guideType} onValueChange={(v) => setGuideType(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              <SelectItem value="Castellano">Castellano</SelectItem>
              <SelectItem value="Inglés">Inglés</SelectItem>
              <SelectItem value="Portugués">Portugués</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 mt-5">
          <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          <Label className="text-xs">Excursión privada</Label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}

// ─── Add form: Transfer ────────────────────────────────────────────────────────

function TransferAddForm({ reservationId, agencyId, providers, transferSegments, onAdd }: {
  reservationId: string; agencyId: string;
  providers: Provider[]; transferSegments: TransferSegment[]; onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [transferSegmentId, setTransferSegmentId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [medium, setMedium] = useState("");
  const [pickupProviderId, setPickupProviderId] = useState("");
  const [pickupOther, setPickupOther] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [paxCount, setPaxCount] = useState("1");
  const [pending, start] = useTransition();

  function reset() {
    setProviderId(""); setTransferSegmentId(""); setDate(""); setTime(""); setMedium("");
    setPickupProviderId(""); setPickupOther(""); setIsPrivate(false); setPaxCount("1"); setOpen(false);
  }

  function submit() {
    if (!providerId) return toast.error("Seleccioná un prestador");
    if (!date) return toast.error("Ingresá la fecha");
    start(async () => {
      try {
        await addTransfer(reservationId, agencyId, {
          providerId, transferSegmentId: transferSegmentId || undefined, date,
          time: time || undefined, medium: medium || undefined,
          pickupProviderId: pickupProviderId || undefined, pickupOther: pickupOther || undefined,
          isPrivate, paxCount: Number(paxCount),
        });
        onAdd(); reset();
      } catch { toast.error("Error al agregar"); }
    });
  }

  if (!open) return (
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar traslado
    </Button>
  );

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Operadora *</Label>
          <ProviderSelect value={providerId} onChange={setProviderId} providers={providers} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tramo</Label>
          <Select value={transferSegmentId} onValueChange={(v) => setTransferSegmentId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              {transferSegments.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Fecha *</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Horario</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pax</Label>
          <Input type="number" value={paxCount} onChange={(e) => setPaxCount(e.target.value)} min={1} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Medio de transporte</Label>
          <Input value={medium} onChange={(e) => setMedium(e.target.value)} maxLength={60} placeholder="Vuelo AR1234..." />
        </div>
        <div className="flex items-center gap-2 mt-5">
          <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          <Label className="text-xs">Traslado privado</Label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Origen — hotel</Label>
          <ProviderSelect value={pickupProviderId} onChange={setPickupProviderId} providers={providers} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Origen — otro</Label>
          <Input value={pickupOther} onChange={(e) => setPickupOther(e.target.value)} maxLength={100} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}

// ─── Add form: Ticket ──────────────────────────────────────────────────────────

function TicketAddForm({ reservationId, agencyId, providers, ticketSegments, onAdd }: {
  reservationId: string; agencyId: string;
  providers: Provider[]; ticketSegments: TicketSegment[]; onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [ticketSegmentId, setTicketSegmentId] = useState("");
  const [date, setDate] = useState("");
  const [passengerName, setPassengerName] = useState("");
  const [passengerType, setPassengerType] = useState<"ADULT" | "CHILD" | "INFANT">("ADULT");
  const [ticketNumber, setTicketNumber] = useState("");
  const [pending, start] = useTransition();

  function reset() {
    setProviderId(""); setTicketSegmentId(""); setDate(""); setPassengerName("");
    setPassengerType("ADULT"); setTicketNumber(""); setOpen(false);
  }

  function submit() {
    if (!providerId) return toast.error("Seleccioná un prestador");
    if (!date) return toast.error("Ingresá la fecha");
    start(async () => {
      try {
        await addTicket(reservationId, agencyId, {
          providerId, ticketSegmentId: ticketSegmentId || undefined, date,
          passengerName: passengerName || undefined, passengerType,
          ticketNumber: ticketNumber || undefined,
        });
        onAdd(); reset();
      } catch { toast.error("Error al agregar"); }
    });
  }

  if (!open) return (
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar ticket
    </Button>
  );

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Aerolínea / Empresa *</Label>
          <ProviderSelect value={providerId} onChange={setProviderId} providers={providers} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Segmento</Label>
          <Select value={ticketSegmentId} onValueChange={(v) => setTicketSegmentId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">—</SelectItem>
              {ticketSegments.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Nombre pasajero</Label>
          <Input value={passengerName} onChange={(e) => setPassengerName(e.target.value)} maxLength={80} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo pasajero</Label>
          <Select value={passengerType} onValueChange={(v) => setPassengerType((v ?? "ADULT") as "ADULT" | "CHILD" | "INFANT")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ADULT">Adulto</SelectItem>
              <SelectItem value="CHILD">Menor</SelectItem>
              <SelectItem value="INFANT">Bebé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Fecha vuelo *</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">N° ticket / PNR</Label>
          <Input value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} maxLength={40} className="font-mono" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}

// ─── Add form: Rental ──────────────────────────────────────────────────────────

function RentalAddForm({ reservationId, agencyId, providers, onAdd }: {
  reservationId: string; agencyId: string; providers: Provider[]; onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [vehicleDesc, setVehicleDesc] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupPlace, setPickupPlace] = useState("");
  const [dropoffAt, setDropoffAt] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [dropoffPlace, setDropoffPlace] = useState("");
  const [pending, start] = useTransition();

  function reset() {
    setProviderId(""); setVehicleDesc(""); setPickupAt(""); setPickupTime(""); setPickupPlace("");
    setDropoffAt(""); setDropoffTime(""); setDropoffPlace(""); setOpen(false);
  }

  function submit() {
    if (!providerId) return toast.error("Seleccioná un prestador");
    start(async () => {
      try {
        await addRental(reservationId, agencyId, {
          providerId, vehicleDesc: vehicleDesc || undefined,
          pickupAt: pickupAt || undefined, pickupTime: pickupTime || undefined, pickupPlace: pickupPlace || undefined,
          dropoffAt: dropoffAt || undefined, dropoffTime: dropoffTime || undefined, dropoffPlace: dropoffPlace || undefined,
        });
        onAdd(); reset();
      } catch { toast.error("Error al agregar"); }
    });
  }

  if (!open) return (
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar alquiler
    </Button>
  );

  return (
    <div className="border rounded-md p-3 space-y-2 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Operadora *</Label>
          <ProviderSelect value={providerId} onChange={setProviderId} providers={providers} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Descripción vehículo</Label>
          <Input value={vehicleDesc} onChange={(e) => setVehicleDesc(e.target.value)} maxLength={100} placeholder="Ford Fiesta 5 ptas..." />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Retiro fecha</Label>
          <Input type="date" value={pickupAt} onChange={(e) => setPickupAt(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Horario retiro</Label>
          <Input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Lugar retiro</Label>
          <Input value={pickupPlace} onChange={(e) => setPickupPlace(e.target.value)} maxLength={80} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Devolución fecha</Label>
          <Input type="date" value={dropoffAt} onChange={(e) => setDropoffAt(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Horario dev.</Label>
          <Input type="time" value={dropoffTime} onChange={(e) => setDropoffTime(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Lugar dev.</Label>
          <Input value={dropoffPlace} onChange={(e) => setDropoffPlace(e.target.value)} maxLength={80} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}

// ─── Add form: Misc ────────────────────────────────────────────────────────────

function MiscAddForm({ reservationId, agencyId, providers, onAdd }: {
  reservationId: string; agencyId: string; providers: Provider[]; onAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState("");
  const [description, setDescription] = useState("");
  const [vatType, setVatType] = useState<"GRAVADO" | "GRAVADO_TRANSPORTE" | "NO_COMPUTABLE" | "EXENTO" | "IMPUESTOS">("GRAVADO");
  const [pending, start] = useTransition();

  function reset() { setProviderId(""); setDescription(""); setVatType("GRAVADO"); setOpen(false); }

  function submit() {
    if (!providerId) return toast.error("Seleccioná un prestador");
    if (!description.trim()) return toast.error("Ingresá una descripción");
    start(async () => {
      try {
        await addMisc(reservationId, agencyId, { providerId, description, vatType });
        onAdd(); reset();
      } catch { toast.error("Error al agregar"); }
    });
  }

  if (!open) return (
    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
      <Plus className="h-3.5 w-3.5 mr-1" /> Agregar item
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
          <Label className="text-xs">Tipo IVA</Label>
          <Select value={vatType} onValueChange={(v) => setVatType((v ?? "GRAVADO") as typeof vatType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GRAVADO">Gravado 21%</SelectItem>
              <SelectItem value="GRAVADO_TRANSPORTE">Gravado Transporte 10.5%</SelectItem>
              <SelectItem value="NO_COMPUTABLE">No Computable</SelectItem>
              <SelectItem value="EXENTO">Exento</SelectItem>
              <SelectItem value="IMPUESTOS">Impuestos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Descripción *</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="Seguro de viaje, visa, propina..." />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
        <Button type="button" size="sm" onClick={submit} disabled={pending}>Agregar</Button>
      </div>
    </div>
  );
}
