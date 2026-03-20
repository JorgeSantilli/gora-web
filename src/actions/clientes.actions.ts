"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ClientSchema = z.object({
  code: z.coerce.number().int().positive(),
  fantasyName: z.string().min(1).max(120),
  legalName: z.string().optional(),
  clientTypeId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zone: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  taxId: z.string().optional(),
  taxPosition: z.enum(["RI", "MO", "CF", "EX", "NC"]).optional(),
  isDirect: z.boolean().default(false),
  hasCreditAccount: z.boolean().default(false),
  creditLimit: z.coerce.number().optional(),
  creditLimitUsd: z.coerce.number().optional(),
  commission: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

type ClientInput = z.infer<typeof ClientSchema>;

function cleanClient(data: ClientInput) {
  return {
    ...data,
    legalName: data.legalName || undefined,
    clientTypeId: data.clientTypeId || undefined,
    address: data.address || undefined,
    city: data.city || undefined,
    zone: data.zone || undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    taxId: data.taxId || undefined,
    taxPosition: data.taxPosition || undefined,
    notes: data.notes || undefined,
    creditLimit: data.creditLimit || undefined,
    creditLimitUsd: data.creditLimitUsd || undefined,
    commission: data.commission || undefined,
  };
}

export async function createClient(
  agencyId: string,
  agencySlug: string,
  data: ClientInput
) {
  const validated = ClientSchema.parse(data);
  await prisma.client.create({
    data: { agencyId, ...cleanClient(validated) },
  });
  revalidatePath(`/${agencySlug}/clientes`);
  redirect(`/${agencySlug}/clientes`);
}

export async function updateClient(
  id: string,
  agencyId: string,
  agencySlug: string,
  data: ClientInput
) {
  const validated = ClientSchema.parse(data);
  await prisma.client.update({
    where: { id, agencyId },
    data: cleanClient(validated),
  });
  revalidatePath(`/${agencySlug}/clientes`);
  redirect(`/${agencySlug}/clientes`);
}

export async function deleteClient(
  id: string,
  agencyId: string,
  agencySlug: string
) {
  await prisma.client.delete({ where: { id, agencyId } });
  revalidatePath(`/${agencySlug}/clientes`);
  redirect(`/${agencySlug}/clientes`);
}

export async function toggleClientActive(
  id: string,
  agencyId: string,
  active: boolean
) {
  await prisma.client.update({ where: { id, agencyId }, data: { active } });
  revalidatePath(`/[agencySlug]/clientes`);
}
