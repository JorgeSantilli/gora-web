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
import { createClient, updateClient } from "@/actions/clientes.actions";
import type { Client, ClientType } from "@/generated/prisma";

interface ClientFormProps {
  agencyId: string;
  agencySlug: string;
  client?: Client;
  clientTypes: ClientType[];
}

const TAX_POSITIONS = [
  { value: "RI", label: "Responsable Inscripto" },
  { value: "MO", label: "Monotributista" },
  { value: "CF", label: "Consumidor Final" },
  { value: "EX", label: "Exento" },
  { value: "NC", label: "No Categorizado" },
];

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

export function ClientForm({ agencyId, agencySlug, client, clientTypes }: ClientFormProps) {
  const isEdit = !!client;
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState(client?.code?.toString() ?? "");
  const [fantasyName, setFantasyName] = useState(client?.fantasyName ?? "");
  const [legalName, setLegalName] = useState(client?.legalName ?? "");
  const [clientTypeId, setClientTypeId] = useState(client?.clientTypeId ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [city, setCity] = useState(client?.city ?? "");
  const [zone, setZone] = useState(client?.zone ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [taxId, setTaxId] = useState(client?.taxId ?? "");
  const [taxPosition, setTaxPosition] = useState(client?.taxPosition ?? "");
  const [isDirect, setIsDirect] = useState(client?.isDirect ?? false);
  const [hasCreditAccount, setHasCreditAccount] = useState(client?.hasCreditAccount ?? false);
  const [creditLimit, setCreditLimit] = useState(client?.creditLimit?.toString() ?? "");
  const [creditLimitUsd, setCreditLimitUsd] = useState(client?.creditLimitUsd?.toString() ?? "");
  const [commission, setCommission] = useState(client?.commission?.toString() ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [active, setActive] = useState(client?.active ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        code: Number(code),
        fantasyName,
        legalName,
        clientTypeId,
        address,
        city,
        zone,
        phone,
        email,
        taxId,
        taxPosition: taxPosition as "RI" | "MO" | "CF" | "EX" | "NC" | undefined,
        isDirect,
        hasCreditAccount,
        creditLimit: creditLimit ? Number(creditLimit) : undefined,
        creditLimitUsd: creditLimitUsd ? Number(creditLimitUsd) : undefined,
        commission: commission ? Number(commission) : undefined,
        notes,
        active,
      };

      if (isEdit) {
        await updateClient(client.id, agencyId, agencySlug, data);
      } else {
        await createClient(agencyId, agencySlug, data);
      }
      toast.success(isEdit ? "Cliente actualizado" : "Cliente creado");
    } catch {
      toast.error("Error al guardar");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identificación */}
      <Section title="Identificación">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Código" required>
            <Input
              type="number"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required min={1}
              placeholder="1"
            />
          </Field>
          <Field label="Tipo de cliente">
            <Select value={clientTypeId} onValueChange={(v) => setClientTypeId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin tipo</SelectItem>
                {clientTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Nombre / Razón social" required>
          <Input
            value={fantasyName}
            onChange={(e) => setFantasyName(e.target.value)}
            required maxLength={120}
            placeholder="Agencia Sol y Luna"
          />
        </Field>

        <Field label="Nombre legal">
          <Input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            maxLength={120}
            placeholder="Sol y Luna S.R.L."
          />
        </Field>
      </Section>

      <Separator />

      {/* Contacto */}
      <Section title="Contacto">
        <Field label="Dirección">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ciudad">
            <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
          </Field>
          <Field label="Zona / Aeropuerto">
            <Input
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              maxLength={10}
              placeholder="BUE, MDZ, COR..."
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Teléfono">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
          </Field>
        </div>
      </Section>

      <Separator />

      {/* Fiscal */}
      <Section title="Datos Fiscales">
        <div className="grid grid-cols-2 gap-4">
          <Field label="CUIT">
            <Input
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              maxLength={13}
              placeholder="20-12345678-9"
            />
          </Field>
          <Field label="Condición IVA">
            <Select value={taxPosition} onValueChange={(v) => setTaxPosition(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                {TAX_POSITIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Comisión (%)">
          <Input
            type="number"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            min={0} max={100} step={0.01}
            placeholder="0.00"
          />
        </Field>
      </Section>

      <Separator />

      {/* Cuenta corriente */}
      <Section title="Cuenta Corriente">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Límite de crédito ($)">
            <Input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              min={0} step={0.01}
              placeholder="0.00"
              disabled={!hasCreditAccount}
            />
          </Field>
          <Field label="Límite de crédito (u$s)">
            <Input
              type="number"
              value={creditLimitUsd}
              onChange={(e) => setCreditLimitUsd(e.target.value)}
              min={0} step={0.01}
              placeholder="0.00"
              disabled={!hasCreditAccount}
            />
          </Field>
        </div>
      </Section>

      <Separator />

      {/* Opciones */}
      <Section title="Opciones">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Cliente Directo (pasajero)</Label>
              <p className="text-xs text-muted-foreground">
                No es agencia, es pasajero o empresa directa
              </p>
            </div>
            <Switch checked={isDirect} onCheckedChange={setIsDirect} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Tiene cuenta corriente</Label>
              <p className="text-xs text-muted-foreground">
                Habilita límites de crédito en $ y u$s
              </p>
            </div>
            <Switch checked={hasCreditAccount} onCheckedChange={setHasCreditAccount} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Activo</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
      </Section>

      <Separator />

      {/* Notas */}
      <Section title="Notas">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Observaciones, notas internas..."
          maxLength={1000}
        />
      </Section>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear Cliente"}
        </Button>
      </div>
    </form>
  );
}
