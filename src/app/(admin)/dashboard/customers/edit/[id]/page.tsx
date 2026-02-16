import { prisma } from "@/lib/db/prisma";
import CustomerForm from "@/components/admin/customer-form";
import { notFound } from "next/navigation";

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  const { id } = await params;

  // ✅ FIX: Added 'include: { addresses: true }'
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: true,
    },
  });

  if (!customer) notFound();

  return <CustomerForm initialData={customer} />;
}
