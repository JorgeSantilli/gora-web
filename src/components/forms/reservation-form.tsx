"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createReservation, updateReservationHeader } from "@/actions/reservas.actions";
import type { Reservation, ReservationOrigin, Client, Program } from "@/generated/prisma";

interface ReservationFormProps {
  agencyId: string;
  agencySlug: string;
  reservation?: Reservation;
  origins: ReservationOrigin[];
  clients: Client[];
  programs: Program[];
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

export function ReservationForm({ agencyId, agencySlug, reservation, origins, clients, programs }: ReservationFormProps) {
  const isEdit = !!reservation;
  const [loading, setLoading] = useState(false);

  // Origen
  const [originId, setOriginId] = useState("");
  // Encabezado
  const [clientId, setClientId] = useState(reservation?.clientId ?? "");
  const [programId, setProgramId] = useState(reservation?.programId ?? "");
  const [leadPax, setLeadPax] = useState(reservation?.leadPax ?? "");
  const [adults, setAdults] = useState(reservation?.adults?.toString() ?? "1");
  const [minors, setMinors] = useState(reservation?.minors?.toString() ?? "0");
  const [free, setFree] = useState(reservation?.free?.toString() ?? "0");
  // Fechas
  const [checkIn, setCheckIn] = useState(
    reservation?.checkIn ? new Date(reservation.checkIn).toISOString().split("T")[0] : ""
  );
  const [checkOut, setCheckOut] = useState(
    reservation?.checkOut ? new Date(reservation.checkOut).toISOString().split("T")[0] : ""
  );
  const [inMedium, setInMedium] = useState(reservation?.inMedium ?? "");
  const [inTime, setInTime] = useState(reservation?.inTime ?? "");
  const [outMedium, setOutMedium] = useState(reservation?.outMedium ?? "");
  const [outTime, setOutTime] = useState(reservation?.outTime ?? "");
  const [expiresAt, setExpiresAt] = useState(
    reservation?.expiresAt ? new Date(reservation.expiresAt).toISOString().split("T")[0] : ""
  );
  // Financiero
  const [currency, setCurrency] = useState<"PESOS" | "USD">(
    (reservation?.currency as "PESOS" | "USD") ?? "PESOS"
  );
  const [commission, setCommission] = useState(reservation?.commission?.toString() ?? "");
  const [isFixedCommission, setIsFixedCommission] = useState(reservation?.isFixedCommission ?? true);
  // Notas
  const [notes, setNotes] = useState(reservation?.notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        clientId: clientId || undefined,
        programId: programId || undefined,
        leadPax,
        adults: Number(adults),
        minors: Number(minors),
        free: Number(free),
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        inMedium: inMedium || undefined,
        inTime: inTime || undefined,
        outMedium: outMedium || undefined,
        outTime: outTime || undefined,
        expiresAt: expiresAt || undefined,
        currency,
        commission: commission ? Number(commission) : undefined,
        isFixedCommission,
        notes: notes || undefined,
      };

      if (isEdit) {
        await updateReservationHeader(reservation.id, agencyId, agencySlug, data);
        toast.success("Reserva actualizada");
        setLoading(false);
      } else {
        await createReservation(agencyId, agencySlug, { originId, ...data });
        // redirect inside action
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Origen — solo en creación */}
      {!isEdit && (
        <>
          <Section title="Origen de la reserva">
            <Field label="Origen" required>
              <Select value={originId} onValueChange={(v) => setOriginId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná el origen" />
                </SelectTrigger>
                <SelectContent>
                  {origins.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.letter} — {o.label}
                      {o.autoNumber && (
                        <span className="text-muted-foreground ml-2">
                          (próximo: {o.letter}{o.lastNumber + 1})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Section>
          <Separator />
        </>
      )}

      {/* Pasajeros */}
      <Section title="Pasajeros">
        <Field label="Titular / PAX principal" required>
          <Input
            value={leadPax}
            onChange={(e) => setLeadPax(e.target.value)}
            required maxLength={120}
            placeholder="GARCIA, JUAN"
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Adultos" required>
            <Input
              type="number" value={adults}
              onChange={(e) => setAdults(e.target.value)}
              min={1} required
            />
          </Field>
          <Field label="Menores">
            <Input
              type="number" value={minors}
              onChange={(e) => setMinors(e.target.value)}
              min={0}
            />
          </Field>
          <Field label="Gratuitos">
            <Input
              type="number" value={free}
              onChange={(e) => setFree(e.target.value)}
              min={0}
            />
          </Field>
        </div>
      </Section>

      <Separator />

      {/* Cliente y Programa */}
      <Section title="Cliente y Programa">
        <Field label="Cliente / Agencia">
          <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Sin cliente asignado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin cliente</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.fantasyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Programa / Itinerario">
          <Select value={programId} onValueChange={(v) => setProgramId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Sin programa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin programa</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Separator />

      {/* Fechas */}
      <Section title="Fechas y Medios">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Check-in">
            <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </Field>
          <Field label="Check-out">
            <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Medio de entrada">
            <Input
              value={inMedium} onChange={(e) => setInMedium(e.target.value)}
              placeholder="AR1234, Bus Andesmar..."
              maxLength={80}
            />
          </Field>
          <Field label="Horario entrada">
            <Input type="time" value={inTime} onChange={(e) => setInTime(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Medio de salida">
            <Input
              value={outMedium} onChange={(e) => setOutMedium(e.target.value)}
              placeholder="AR1235, Bus Andesmar..."
              maxLength={80}
            />
          </Field>
          <Field label="Horario salida">
            <Input type="time" value={outTime} onChange={(e) => setOutTime(e.target.value)} />
          </Field>
        </div>
        <Field label="Vence el (reserva tentativa)">
          <Input
            type="date" value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="max-w-xs"
          />
        </Field>
      </Section>

      <Separator />

      {/* Financiero */}
      <Section title="Datos Financieros">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Moneda">
            <Select value={currency} onValueChange={(v) => setCurrency((v ?? "PESOS") as "PESOS" | "USD")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PESOS">$ Pesos</SelectItem>
                <SelectItem value="USD">u$s Dólares</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Comisión (%)">
            <Input
              type="number" value={commission}
              onChange={(e) => setCommission(e.target.value)}
              min={0} max={100} step={0.01}
              placeholder="0.00"
            />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={isFixedCommission} onCheckedChange={setIsFixedCommission} />
          <div>
            <Label>Comisión fija</Label>
            <p className="text-xs text-muted-foreground">Si no es fija, se calcula sobre cada servicio</p>
          </div>
        </div>
      </Section>

      <Separator />

      {/* Notas */}
      <Section title="Notas / Antecedentes">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Historial, observaciones, pedidos especiales..."
          maxLength={2000}
        />
      </Section>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear Reserva"}
        </Button>
      </div>
    </form>
  );
}
