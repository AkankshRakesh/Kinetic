"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Newsreader, Space_Grotesk } from "next/font/google";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/providers";
import Image from "next/image";
import GuestUploadsManager from "./components/GuestUploadsManager";
import { apiGet } from "@/lib/api/client";

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

type EventItem = {
  id: string;
  name: string;
  location?: string | null;
  eventDate?: string | null;
  region: string;
  status: string;
  invitationCount: number;
  acceptedCount: number;
};


function LogEntry({ stamp, label, accent }: { stamp: string; label: string; accent: string }) {
  return (
    <li className="border-l-2 pl-3" style={{ borderColor: accent }}>
      <p className="text-[9px] tracking-[0.18em] text-[#9f8e86]">{stamp}</p>
      <p className="mt-1 text-xs tracking-[0.05em] text-[#dac7bd]">{label}</p>
    </li>
  );
}

export default function EventDashboardPage() {
  const { session } = useAuth();


  const params = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEvent() {
      try {
        const data = await apiGet<{ data?: EventItem }>(`/api/events/${params.eventId}`);
        
        if (isMounted && data.data) {
        setEvent(data.data);
        }
      } catch {
        // Event not found or not accessible
      }
      }

    void loadEvent();

    return () => {
      isMounted = false;
    };
  }, [params.eventId]);

  const acceptedPercent = event?.invitationCount ? Math.round((event.acceptedCount / event.invitationCount) * 100) : 0;

  return (
    <main className={`${uiFont.className} min-h-screen bg-[#0b0d0f] text-[#e6e1dd] py-10`}> 
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div className="max-w-6xl mx-auto px-6">
          <header className="mb-8">
            <p className="text-[10px] tracking-[0.28em] text-[#a58f83]">EVENT_STATUS: {event?.status ?? "LOADING"}</p>
            <h1 className={`${displayFont.className} text-5xl font-semibold italic text-[#f6d3a6] leading-tight`}>Event Terminal</h1>
            <p className="mt-2 text-sm text-[#b9a59b]">Event-specific command center for managing high-stakes logistics, guest protocols, and synthetic telemetry.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2">
              <div className="rounded-lg border border-[#2c2520] bg-[#0f1113] p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className={`${displayFont.className} text-3xl italic text-[#e6dad3]`}>RSVP Momentum</h2>
                    <p className="text-[10px] tracking-[0.18em] text-[#8f8078] mt-1">{event?.region ?? "AWS | ap-south-1"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-semibold italic text-[#f3bf7a]">{acceptedPercent}%</p>
                    <p className="text-[10px] tracking-[0.2em] text-[#8f8078]">ACCEPTED</p>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-full h-56 rounded-md border border-[#302922] bg-gradient-to-b from-[#0f1214] to-[#0b0d0f] flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-[110px] font-extralight text-[#2a221f] -tracking-tight opacity-40">{acceptedPercent}%</p>
                        <p className="-mt-20 text-2xl font-semibold text-[#f3bf7a]">{acceptedPercent}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-64">
                    <div className="rounded-md border border-[#2b2520] bg-[#0e1113] p-4 mb-4">
                      <p className="text-[10px] tracking-[0.18em] text-[#8f8078]">INVITES</p>
                      <p className="mt-1 text-2xl font-medium text-[#e6ddd5]">{event?.invitationCount ?? 0}</p>
                    </div>
                    <div className="rounded-md border border-[#2b2520] bg-[#0e1113] p-4 mb-4">
                      <p className="text-[10px] tracking-[0.18em] text-[#8f8078]">ACCEPTED</p>
                      <p className="mt-1 text-2xl font-medium text-[#f3bf7a]">{event?.acceptedCount ?? 0}</p>
                    </div>
                    <div className="rounded-md border border-[#2b2520] bg-[#0e1113] p-4">
                      <p className="text-[10px] tracking-[0.18em] text-[#8f8078]">PENDING</p>
                      <p className="mt-1 text-2xl font-medium text-[#e6ddd5]">{Math.max((event?.invitationCount ?? 0) - (event?.acceptedCount ?? 0), 0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-lg border border-[#2b2520] bg-[#0f1113] p-4">
                  <h3 className={`${displayFont.className} text-xl italic text-[#e6dad3] mb-3`}>Protocol Log</h3>
                  <div className="bg-[#070808] rounded-md p-4 text-xs text-[#c9bdae]" style={{ minHeight: 180 }}>
                    <ul className="space-y-2">
                      {["14:22:01  SYSTEM_BOOT: Event terminal services initialized.", "14:22:04  SECURE_TUNNEL: Establishing ap-south-1 connection...", "14:22:06  AUTH: Operator identity verified (Level 4).", "14:22:09  WARNING: No guests currently queued for protocol.", "14:22:15  LOG: Waiting for synthetic catalyst deployment."].map((l, i) => (
                        <li key={i} className="text-[12px]">
                          <span className="text-[#9f8e86] mr-3">•</span>
                          <span className="font-mono text-[#d6c9bd]">{l}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-[#2b2520] bg-[#0f1113] p-6">
                  <h3 className={`${displayFont.className} text-2xl italic text-[#e6dad3]`}>Synthetic Catalyst 01</h3>
                  <p className="mt-2 text-sm text-[#c5b3a8]">Open the Guests rail to send event-specific invitations and initiate the primary catalyst protocol.</p>
                  <div className="mt-6 border-t border-[#2b2520] pt-4 text-sm text-[#8f8078]">
                    <p className="text-[10px] tracking-[0.2em]">ACTIVE USER</p>
                    <p className="mt-1 text-sm font-medium text-[#ffcfaa]">{session?.user.name}</p>
                    <p className="text-xs text-[#9f8e86]">{session?.user.email}</p>
                  </div>
                </div>
              </div>
            </section>

            <aside>
              <div className="rounded-lg border border-[#2b2520] bg-[#0f1113] p-6 flex flex-col items-center">
                <div className="h-44 w-44 rounded-full border border-[#3c332d] flex items-center justify-center mb-4" style={{ background: `conic-gradient(#f3bf7a 0deg, #f3bf7a ${acceptedPercent * 3.6}deg, #151517 ${acceptedPercent * 3.6}deg 360deg)` }}>
                  <div className="h-36 w-36 rounded-full bg-[#0b0d0f] flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-semibold text-[#f3bf7a]">{acceptedPercent}%</p>
                      <p className="text-[10px] tracking-[0.2em] text-[#8f8078]">RSVP</p>
                    </div>
                  </div>
                </div>
                <h4 className={`${displayFont.className} text-lg italic text-[#e6dad3] mb-2`}>Guest Flow</h4>
                <p className="text-sm text-[#c5b3a8] text-center">Real-time capacity and arrival sequencing for optimized entry protocols.</p>
              </div>
            </aside>
          </div>
        </div>
      </motion.div>
    </main>
  );
}