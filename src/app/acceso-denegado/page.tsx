import Link from "next/link";

import { Header } from "@/components/layout/Header";

export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen bg-[#F4F8FB] text-[#082F49]">
      <Header />
      <section className="mx-auto flex min-h-[calc(100vh-81px)] max-w-3xl items-center px-4 py-10">
        <div className="rounded-lg border border-[#D9E5EC] bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D71920]">
            Acceso denegado
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[#082F49]">
            No tiene permisos para acceder a esta sección
          </h1>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-md bg-[#0B2E59] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#005B84]"
          >
            Volver al login
          </Link>
        </div>
      </section>
    </main>
  );
}
