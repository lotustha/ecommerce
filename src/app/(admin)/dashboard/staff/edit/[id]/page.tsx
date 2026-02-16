import { prisma } from "@/lib/db/prisma";
import StaffForm from "@/components/admin/staff-form";
import { notFound } from "next/navigation";

interface EditStaffPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStaffPage({ params }: EditStaffPageProps) {
  const { id } = await params;

  const staff = await prisma.user.findUnique({
    where: { id },
  });

  if (!staff) notFound();

  return <StaffForm initialData={staff} />;
}
