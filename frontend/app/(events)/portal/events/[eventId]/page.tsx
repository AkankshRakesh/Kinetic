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
    <main className={`${uiFont.className} min-h-screen bg-[#090b10] text-[#e5e2e3]`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="border-b border-[#2b2520]/60 px-5 pb-5 pt-6 sm:px-8 lg:px-10 lg:pt-8">
          <p className="text-[10px] tracking-[0.28em] text-[#a58f83]">EVENT_STATUS: {event?.status ?? "LOADING"}</p>
          <h1 className={`${displayFont.className} mt-1 text-4xl font-semibold italic leading-none text-[#ffb77b] sm:text-5xl`}>
            {event?.name ?? "Event Terminal"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#b9a59b]">
            {event?.location ?? event?.region ?? "Event-specific command center"}
            {event?.eventDate ? ` // ${event.eventDate}` : ""}. Invitations, guests, telemetry, and responses are isolated to this event.
          </p>
        </div>
        <div className="flex w-full flex-col border-b border-[#2b2520]/60 xl:flex-row">
          <div className="flex-[1.4] border-b border-[#2b2520]/60 px-5 py-6 sm:px-8 lg:px-10 lg:py-7 xl:border-b-0 xl:border-r">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className={`${displayFont.className} text-3xl italic text-[#e6dad3]`}>RSVP Momentum</h2>
                <p className="mt-0.5 text-[10px] tracking-[0.18em] text-[#8f8078]">{event?.region ?? "AWS | ap-south-1"}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-4xl font-semibold italic text-[#ffb77b]">{acceptedPercent}%</p>
                <p className="text-[10px] tracking-[0.2em] text-[#8f8078]">ACCEPTED</p>
              </div>
            </div>

            <div className="relative h-44 overflow-hidden rounded-lg border border-[#302922] bg-[#0f1319]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,183,123,0.16),transparent_40%)]" />
              <svg viewBox="0 0 600 220" className="absolute inset-0 h-full w-full" role="img" aria-label="Momentum graph">
                <path d="M0,160 C90,70 180,190 260,130 C320,90 390,55 460,110 C505,145 555,178 600,80" fill="none" stroke="#ffb77b" strokeWidth="3" strokeDasharray="8 6" />
                <path d="M0,170 C100,120 170,100 245,150 C320,203 420,45 510,130 C545,165 580,190 600,200" fill="none" stroke="#8d6b56" strokeWidth="2" opacity="0.8" />
              </svg>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#2b2520] pt-4 text-[#dbcac1]">
              <div>
                <p className="text-[10px] tracking-[0.18em] text-[#8f8078]">INVITES</p>
                <p className="mt-1 text-2xl font-medium">{event?.invitationCount ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.18em] text-[#8f8078]">ACCEPTED</p>
                <p className="mt-1 text-2xl font-medium">{event?.acceptedCount ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.18em] text-[#8f8078]">PENDING</p>
                <p className="mt-1 text-2xl font-medium">{Math.max((event?.invitationCount ?? 0) - (event?.acceptedCount ?? 0), 0)}</p>
              </div>
            </div>
          </div>

          <div className="flex-[0.85] px-5 py-6 sm:px-8 lg:py-7">
            <h2 className={`${displayFont.className} mb-5 text-3xl italic text-[#e6dad3]`}>Guest Flow</h2>
            <div
              className="mx-auto grid h-44 w-44 place-items-center rounded-full border border-[#3c332d]"
              style={{ background: `conic-gradient(#ffb77b 0deg, #ffb77b ${acceptedPercent * 3.6}deg, #201f23 ${acceptedPercent * 3.6}deg 360deg)` }}
            >
              <div className="grid h-36 w-36 place-items-center rounded-full bg-[#0f1319] text-center">
                <div>
                  <p className="text-4xl font-medium text-[#ffb77b]">{acceptedPercent}%</p>
                  <p className="text-[10px] tracking-[0.2em] text-[#8f8078]">RSVP</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-h-80 grid-cols-1 xl:grid-cols-[0.9fr_1.1fr_1.1fr]">
          <div className="border-b border-[#2b2520]/60 px-5 py-6 sm:px-8 lg:px-10 lg:py-7 xl:border-b-0 xl:border-r">
            <h2 className={`${displayFont.className} mb-5 text-2xl italic text-[#e6dad3]`}>Protocol Log</h2>
            <ul className="space-y-5">
              <LogEntry stamp="LIVE // RSVP" label="Event invitation scope is isolated" accent="#c8ff6c" />
              <LogEntry stamp="SYNC // GUESTS" label="Guest roster bound to selected event" accent="#ffcf80" />
              <LogEntry stamp="MAIL // TOKEN" label="Response links remain secure by invite token" accent="#67d4ff" />
            </ul>
          </div>
          <div className="relative min-h-65 overflow-hidden border-b border-[#2b2520]/60 xl:border-b-0 xl:border-r">
            {/* <Image
              src="/events.gif"
              alt=""
              aria-hidden="true"
              fill
              unoptimized
              className="object-cover object-center opacity-85"
              sizes="(min-width: 1280px) 33vw, 100vw"
            /> */}
            <div className="absolute inset-0 bg-linear-to-r from-[#090b10]/80 via-[#090b10]/25 to-[#090b10]/65" />
            <div className="absolute left-5 top-5 rounded-sm border border-[#ffb77b]/45 bg-[#090b10]/80 px-2 py-1 text-[9px] font-semibold tracking-[0.2em] text-[#ffb77b]">
              EVENT_SIGNAL
            </div>
          </div>
          <div className="relative px-5 py-6 sm:px-8 lg:py-7">
            <h2 className={`${displayFont.className} mb-3 text-3xl italic text-[#e6dad3]`}>Synthetic Catalyst 01</h2>
            <p className="max-w-sm text-sm leading-relaxed text-[#c5b3a8]">
              Open the Guests rail to send event-specific invitations and review responses for this event.
            </p>
            <div className="mt-24">
              <p className="text-[10px] tracking-[0.2em] text-[#8f8078]">ACTIVE USER</p>
              <p className="mt-1 text-sm font-medium text-[#ffcfaa]">{session?.user.name}</p>
              <p className="text-xs text-[#9f8e86]">{session?.user.email}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}