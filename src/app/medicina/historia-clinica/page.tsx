"use client";

import { useRouter } from "next/navigation";

import { ClinicalHistory } from "@/components/clinical/ClinicalHistory";
import { AppShell } from "@/components/layout/AppShell";

export default function HistoriaClinicaPage() {
  const router = useRouter();
  return (
    <AppShell role="medicina">
      <ClinicalHistory onBack={() => router.push("/medicina")} />
    </AppShell>
  );
}
