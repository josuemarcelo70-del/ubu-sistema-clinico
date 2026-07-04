"use client";

import { useRouter } from "next/navigation";

import { LaboratorioModule } from "@/components/clinical/MedicineRecords";
import { AppShell } from "@/components/layout/AppShell";

export default function SolicitudesLaboratorioPage() {
  const router = useRouter();
  return (
    <AppShell role="medicina">
      <LaboratorioModule onBack={() => router.push("/medicina")} />
    </AppShell>
  );
}
