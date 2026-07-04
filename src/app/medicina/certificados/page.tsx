"use client";

import { useRouter } from "next/navigation";

import { CertificadosModule } from "@/components/clinical/MedicineRecords";
import { AppShell } from "@/components/layout/AppShell";

export default function CertificadosPage() {
  const router = useRouter();
  return (
    <AppShell role="medicina">
      <CertificadosModule onBack={() => router.push("/medicina")} />
    </AppShell>
  );
}
