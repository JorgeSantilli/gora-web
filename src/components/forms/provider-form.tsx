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
import { createProvider, updateProvider } from "@/actions/prestadores.actions";
import type { Provider, ServiceProviderType, ProviderOrigin } from "@/generated/prisma";

interface ProviderFormProps {
  agencyId: string;
  agencySlug: string;
  provider?: Provider;
  serviceProviderTypes: ServiceProviderType[];
  providerOrigins: ProviderOrigin[];
}

const TAX_POSITIONS = [
  { value: "RI", label: "Responsable Inscripto" },
  { value: "MO", label: "Monotributista" },
  { value: "CF", label: "Consumidor Final" },
  { value: "EX", label: "Exento" },
  { value: "NC", label: "No Categorizado" },
];

const CATEGORIES = ["1 estrella", "2 estrellas", "3 estrellas", "4 estrellas", "5 estrellas"];

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

export function ProviderForm({
  agencyId,
  agencySlug,
  provider,
  serviceProviderTypes,
  providerOrigins,
}: ProviderFormProps) {
  const isEdit = !!provider;
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState(provider?.code?.toString() ?? "");
  const [fantasyName, setFantasyName] = useState(provider?.fantasyName ?? "");
  const [legalName, setLegalName] = useState(provider?.legalName ?? "");
  const [typeId, setTypeId] = useState(provider?.typeId ?? "");
  const [originId, setOriginId] = useState(provider?.originId ?? "");
  const [address, setAddress] = useState(provider?.address ?? "");
  const [city, setCity] = useState(provider?.city ?? "");
  const [phone, setPhone] = useState(provider?.phone ?? "");
  const [email, setEmail] = useState(provider?.email ?? "");
  const [taxId, setTaxId] = useState(provider?.taxId ?? "");
  const [taxPosition, setTaxPosition] = useState(provider?.taxPosition ?? "");
  const [category, setCategory] = useState(provider?.category ?? "");
  const [isSupplier, setIsSupplier] = useState(provider?.isSupplier ?? false);
  const [sendVoucherByEmail, setSendVoucherByEmail] = useState(provider?.sendVoucherByEmail ?? false);
  const [additionalInfo, setAdditionalInfo] = useState(provider?.additionalInfo ?? "");
  const [creditLimit, setCreditLimit] = useState(provider?.creditLimit?.toString() ?? "");
  const [active, setActive] = useState(provider?.active ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        code: Number(code),
        fantasyName,
        legalName,
        typeId,
        originId,
        address,
        city,
        phone,
        email,
        taxId,
        taxPosition: taxPosition as "RI" | "MO" | "CF" | "EX" | "NC" | undefined,
        category,
        isSupplier,
        sendVoucherByEmail,
        additionalInfo,
        creditLimit: creditLimit ? Number(creditLimit) : undefined,
        active,
      };

      if (isEdit) {
        await updateProvider(provider.id, agencyId, agencySlug, data);
      } else {
        await createProvider(agencyId, agencySlug, data);
      }
      toast.success(isEdit ? "Prestador actualizado" : "Prestador creado");
    } catch (err) {
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
          <Field label="Tipo">
            <Select value={typeId} onValueChange={(v) => setTypeId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin tipo</SelectItem>
                {serviceProviderTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Nombre de fantasía" required>
          <Input
            value={fantasyName}
            onChange={(e) => setFantasyName(e.target.value)}
            required maxLength={120}
            placeholder="Hotel Aconcagua"
          />
        </Field>

        <Field label="Razón social">
          <Input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            maxLength={120}
            placeholder="Aconcagua S.R.L."
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Origen">
            <Select value={originId} onValueChange={(v) => setOriginId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin origen</SelectItem>
                {providerOrigins.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Categoría (hoteles)">
            <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
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
          <Field label="Teléfono">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
          </Field>
        </div>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
        </Field>
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
        <Field label="Límite de crédito ($)">
          <Input
            type="number"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            min={0}
            step={0.01}
            placeholder="0.00"
          />
        </Field>
      </Section>

      <Separator />

      {/* Opciones */}
      <Section title="Opciones">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Es Proveedor (no Prestador)</Label>
              <p className="text-xs text-muted-foreground">
                Proveedor vende bienes (librería, combustible)
              </p>
            </div>
            <Switch checked={isSupplier} onCheckedChange={setIsSupplier} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Enviar voucher por email</Label>
            <Switch checked={sendVoucherByEmail} onCheckedChange={setSendVoucherByEmail} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Activo</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
      </Section>

      <Separator />

      {/* Info adicional */}
      <Section title="Información Adicional">
        <Textarea
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
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
          {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear Prestador"}
        </Button>
      </div>
    </form>
  );
}
