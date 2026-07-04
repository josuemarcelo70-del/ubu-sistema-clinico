"use client";

import { useRouter } from "next/navigation";

import { MedicineQueue } from "@/components/clinical/MedicineQueue";
import { AppShell } from "@/components/layout/AppShell";

export default function AtencionesPendientesPage() {
  const router = useRouter();
  return (
    <AppShell role="medicina">
      <MedicineQueue onBack={() => router.push("/medicina")} />
    </AppShell>
  );
}
