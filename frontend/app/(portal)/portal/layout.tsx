'use client'
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useAuth } from "@/app/providers";
import { Space_Grotesk } from "next/font/google";


const uiFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});



function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5C6.1 1.5 3.75 3.85 3.75 6.75V9.75L2.25 11.25V12H15.75V11.25L14.25 9.75V6.75C14.25 3.85 11.9 1.5 9 1.5Z" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7.5 12C7.5 12.83 8.17 13.5 9 13.5C9.83 13.5 10.5 12.83 10.5 12" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9 1.5V3M9 15V16.5M1.5 9H3M15 9H16.5M3.2 3.2L4.4 4.4M13.6 13.6L14.8 14.8M3.2 14.8L4.4 13.6M13.6 4.4L14.8 3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 16C2 13 5 11 9 11C13 11 16 13 16 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}



export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    async function handleLogout() {
        await logout();
        router.replace("/login");
      }
      const { status, isBusy, logout } = useAuth();

      
      useEffect(() => {
          if (status === "unauthenticated") {
              router.replace("/login?next=/portal");
            }
        }, [router, status]);
    if (status === "loading") {
        return (
        <main className={`${uiFont.className} min-h-screen bg-[#131314] px-6 py-12 text-[#e5e2e3]`}>
            <div className="mx-auto w-full max-w-6xl text-sm tracking-[0.14em] text-[#bbaaa2]">VERIFYING SESSION...</div>
        </main>
        );
    }

  return (
    <div className="min-h-screen flex flex-col bg-[#090b10] text-[#e5e2e3]">
      {/* NAVBAR */}
      <header className="w-full z-40 bg-[#0f1218]/95 border-b border-[#3b3430]/80 px-0 py-0 backdrop-blur sticky top-0">
        <div className="mx-auto flex h-15 w-full max-w-365 items-center justify-between px-4 text-[11px] tracking-[0.2em] sm:px-8">
          <div className="flex items-center gap-10 text-[#8f8078] h-full">
            <span className="text-lg font-bold tracking-[0.14em] text-[#ffb77b]">KINETIC_LABS</span>
          </div>
          <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Notifications"
                className="grid h-9 w-9 place-items-center rounded-lg text-[#9f8e86] hover:text-[#ffb77b] transition"
              >
                <BellIcon />
              </button>
              <button
                type="button"
                aria-label="Settings"
                className="grid h-9 w-9 place-items-center rounded-lg text-[#9f8e86] hover:text-[#ffb77b] transition"
              >
                <SettingsIcon />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isBusy}
                aria-label="User / Logout"
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#ffb77b]/40 text-[#ffb77b] hover:bg-[#ffb77b]/10 transition disabled:opacity-60"
              >
                <UserIcon />
              </button>
            </div>
        </div>
      </header>

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1">
          {children}
        </main>
    </div>
  );
}
