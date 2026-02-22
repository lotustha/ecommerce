import { prisma } from "@/lib/db/prisma";
import CouponForm from "@/components/admin/coupon-form";
import { notFound } from "next/navigation";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });

  if (!coupon) notFound();

  return <CouponForm initialData={JSON.parse(JSON.stringify(coupon))} />;
}
