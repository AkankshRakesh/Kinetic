"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Space_Grotesk } from "next/font/google";
import { useAuth } from "@/app/providers";

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function PortalPage() {
  const router = useRouter();
  const { status, session, isBusy, logout } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?next=/portal");
    }
  }, [router, status]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (status === "loading") {
    return (
      <main className={`${uiFont.className} min-h-screen bg-[#131314] px-6 py-12 text-[#e5e2e3]`}>
        <div className="mx-auto w-full max-w-6xl text-sm tracking-[0.14em] text-[#bbaaa2]">VERIFYING SESSION...</div>
      </main>
    );
  }

  return (
    <main className={`${uiFont.className} min-h-screen bg-[#131314] px-6 py-12 text-[#e5e2e3]`}>
      <section className="mx-auto w-full max-w-6xl border border-[#343234] bg-[#1a191b]/88 p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-[0.06em] text-[#ffb77b]">KINETIC PORTAL</h1>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isBusy}
            className="bg-linear-to-r from-[#ffb77b] to-[#b16d2e] px-5 py-2 text-xs font-semibold tracking-[0.2em] text-[#2e1500] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isBusy ? "EXITING..." : "LOGOUT"}
          </button>
        </header>

        <div className="space-y-3 text-[#c7b0a6]">
          <p className="text-sm tracking-[0.16em]">AUTH FLOW IS ACTIVE (LARAVEL + SUPABASE)</p>
          <p className="text-sm">
            Signed in as <span className="text-[#ffb77b]">{session?.user.name}</span> ({session?.user.email})
          </p>
          <p className="text-sm text-[#a2938c]">
            Session is validated through Laravel Sanctum against your Supabase PostgreSQL-backed backend.
          </p>
          <Link href="/" className="inline-block pt-4 text-xs tracking-[0.18em] text-[#ffb77b] hover:text-[#ffd0a8]">
            RETURN TO LANDING
          </Link>
        </div>
      </section>
    </main>
  );
}
