"use client";

import { useRouter } from "next/navigation";

import { InformeMensualModule } from "@/components/clinical/MedicineRecords";
import { AppShell } from "@/components/layout/AppShell";

export default function InformeMensualPage() {
  const router = useRouter();
  return (
    <AppShell role="medicina">
      <InformeMensualModule onBack={() => router.push("/medicina")} />
    </AppShell>
  );
}
