"use client";

import { useRouter } from "next/navigation";

import { PrescripcionesModule } from "@/components/clinical/MedicineRecords";
import { AppShell } from "@/components/layout/AppShell";

export default function PrescripcionesPage() {
  const router = useRouter();
  return (
    <AppShell role="medicina">
      <PrescripcionesModule onBack={() => router.push("/medicina")} />
    </AppShell>
  );
}
