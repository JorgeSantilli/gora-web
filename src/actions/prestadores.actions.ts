"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ProviderSchema = z.object({
  code: z.coerce.number().int().positive(),
  fantasyName: z.string().min(1).max(120),
  legalName: z.string().optional(),
  typeId: z.string().optional(),
  originId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  taxId: z.string().optional(),
  taxPosition: z.enum(["RI", "MO", "CF", "EX", "NC"]).optional(),
  category: z.string().optional(),
  isSupplier: z.boolean().default(false),
  sendVoucherByEmail: z.boolean().default(false),
  additionalInfo: z.string().optional(),
  creditLimit: z.coerce.number().optional(),
  active: z.boolean().default(true),
});

type ProviderInput = z.infer<typeof ProviderSchema>;

function cleanProvider(data: ProviderInput) {
  return {
    ...data,
    legalName: data.legalName || undefined,
    typeId: data.typeId || undefined,
    originId: data.originId || undefined,
    address: data.address || undefined,
    city: data.city || undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    taxId: data.taxId || undefined,
    taxPosition: data.taxPosition || undefined,
    category: data.category || undefined,
    additionalInfo: data.additionalInfo || undefined,
    creditLimit: data.creditLimit ? data.creditLimit : undefined,
  };
}

export async function createProvider(
  agencyId: string,
  agencySlug: string,
  data: ProviderInput
) {
  const validated = ProviderSchema.parse(data);
  await prisma.provider.create({
    data: { agencyId, ...cleanProvider(validated) },
  });
  revalidatePath(`/${agencySlug}/prestadores`);
  redirect(`/${agencySlug}/prestadores`);
}

export async function updateProvider(
  id: string,
  agencyId: string,
  agencySlug: string,
  data: ProviderInput
) {
  const validated = ProviderSchema.parse(data);
  await prisma.provider.update({
    where: { id, agencyId },
    data: cleanProvider(validated),
  });
  revalidatePath(`/${agencySlug}/prestadores`);
  redirect(`/${agencySlug}/prestadores`);
}

export async function deleteProvider(
  id: string,
  agencyId: string,
  agencySlug: string
) {
  await prisma.provider.delete({ where: { id, agencyId } });
  revalidatePath(`/${agencySlug}/prestadores`);
  redirect(`/${agencySlug}/prestadores`);
}

export async function toggleProviderActive(
  id: string,
  agencyId: string,
  active: boolean
) {
  await prisma.provider.update({ where: { id, agencyId }, data: { active } });
  revalidatePath(`/[agencySlug]/prestadores`);
}
