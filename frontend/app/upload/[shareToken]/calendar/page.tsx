"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Newsreader, Space_Grotesk } from "next/font/google";
import { useParams } from "next/navigation";
import Link from "next/link";

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const AUTH_API_BASE_URL = (process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? "").replace(/\/$/, "");

type GuestScheduleItem = {
  id: number;
  date_key: string;
  start_time: string;
  end_time: string;
  title: string;
  note: string | null;
  color: string;
};

type PublicScheduleResponse = {
  data?: {
    eventName?: string;
    eventDate?: string | null;
    schedules?: GuestScheduleItem[];
    lastUpdatedAt?: string | null;
  };
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function createDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function keyToDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map((value) => Number(value));
  return new Date(year, month - 1, day);
}

function formatShortDay(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(keyToDate(dateKey));
}

function toMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function startOfToday() {
  return createDateKey(new Date());
}

function createGrid(viewMonth: Date) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDayOfMonth.getDay();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const cells: Array<{ dateKey: string; day: number; inCurrentMonth: boolean }> = [];

  for (let index = 0; index < 42; index += 1) {
    const offset = index - startOffset + 1;
    let day: number;
    let cellMonth = month;
    let cellYear = year;
    let inCurrentMonth = true;

    if (offset < 1) {
      day = previousMonthDays + offset;
      cellMonth = month - 1;
      if (cellMonth < 0) {
        cellMonth = 11;
        cellYear = year - 1;
      }
      inCurrentMonth = false;
    } else if (offset > daysInMonth) {
      day = offset - daysInMonth;
      cellMonth = month + 1;
      if (cellMonth > 11) {
        cellMonth = 0;
        cellYear = year + 1;
      }
      inCurrentMonth = false;
    } else {
      day = offset;
    }

    cells.push({
      dateKey: `${cellYear}-${pad(cellMonth + 1)}-${pad(day)}`,
      day,
      inCurrentMonth,
    });
  }

  return cells;
}

function LeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 1.8V4.2M11 1.8V4.2M2 6H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function GuestCalendarPage() {
  const params = useParams();
  const shareToken = params.shareToken as string;

  const [viewMonth, setViewMonth] = useState(() => toMonthStart(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState(startOfToday());
  const [eventName, setEventName] = useState<string>("Guest Calendar");
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<GuestScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const initializedViewRef = useRef(false);

  const loadSchedule = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? false;

    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`${AUTH_API_BASE_URL}/api/uploads/${shareToken}/schedule`);
      const data = (await response.json()) as PublicScheduleResponse;

      if (!response.ok) {
        throw new Error("Unable to load guest schedule.");
      }

      if (!mountedRef.current) {
        return;
      }

      const scheduleItems = Array.isArray(data.data?.schedules) ? data.data?.schedules : [];
      setSchedules(scheduleItems);
      setEventName(data.data?.eventName || "Guest Calendar");
      setEventDate(data.data?.eventDate ?? null);
      setLastUpdatedAt(data.data?.lastUpdatedAt ?? null);

      if (!initializedViewRef.current) {
        initializedViewRef.current = true;
        if (scheduleItems.length > 0) {
          setSelectedDateKey(scheduleItems[0].date_key);
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Unable to load guest schedule.");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [shareToken]);

  useEffect(() => {
    mountedRef.current = true;
    const initialLoadTimer = window.setTimeout(() => {
      void loadSchedule();
    }, 0);

    const intervalId = window.setInterval(() => {
      void loadSchedule({ background: true });
    }, 60000);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(initialLoadTimer);
      window.clearInterval(intervalId);
    };
  }, [loadSchedule]);

  const calendarDays = useMemo(() => createGrid(viewMonth), [viewMonth]);

  const eventsByDate = useMemo(() => {
    return schedules.reduce<Record<string, GuestScheduleItem[]>>((accumulator, schedule) => {
      if (!accumulator[schedule.date_key]) {
        accumulator[schedule.date_key] = [];
      }
      accumulator[schedule.date_key].push(schedule);
      return accumulator;
    }, {});
  }, [schedules]);

  const selectedDateEvents = useMemo(() => {
    return [...(eventsByDate[selectedDateKey] ?? [])].sort((left, right) => left.start_time.localeCompare(right.start_time));
  }, [eventsByDate, selectedDateKey]);

  const monthEvents = useMemo(() => {
    const monthPrefix = `${viewMonth.getFullYear()}-${pad(viewMonth.getMonth() + 1)}`;
    return schedules.filter((schedule) => schedule.date_key.startsWith(monthPrefix));
  }, [schedules, viewMonth]);

  function handleMonthChange(delta: number) {
    setViewMonth((current) => addMonths(current, delta));
  }

  function handleRefresh() {
    void loadSchedule({ background: true });
  }

  return (
    <main className={`${uiFont.className} min-h-screen bg-[#05070a] text-[#e9e1d8]`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,183,123,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(103,212,255,0.12),transparent_26%),linear-gradient(180deg,#06080c_0%,#05070a_60%,#070a0d_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[72px_72px] opacity-30" />

      {loading ? (
        <div className="relative z-20 flex min-h-screen items-center justify-center px-4">
          <p className="text-[#b9aca4]">Loading calendar...</p>
        </div>
      ) : error ? (
        <div className="relative z-20 flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md rounded-3xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <p className="text-[#ff6b6b]">Error loading calendar</p>
            <p className="mt-2 text-sm text-[#b9aca4]">{error}</p>
            <div className="mt-4">
              <Link
                href={`/upload/${shareToken}`}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-[#e8ddd4] transition hover:border-[#ffb77b]/40 hover:text-[#ffcfaa]"
              >
                BACK TO UPLOAD
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:gap-6 lg:px-8 lg:py-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="grid gap-3 rounded-2xl border border-white/10 bg-[#0b1016]/85 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur sm:gap-4 sm:rounded-3xl sm:p-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-4 lg:rounded-[28px] lg:p-6"
          >
            <div className="space-y-2 sm:space-y-3">
              <p className="text-[9px] font-semibold tracking-[0.32em] text-[#8f8078] sm:text-[10px]">GUEST_CALENDAR</p>
              <h1 className={`${displayFont.className} text-2xl italic leading-[0.95] text-[#f1ddcc] sm:text-4xl lg:text-6xl`}>
                {eventName}
              </h1>
              <p className="max-w-2xl text-xs leading-5 text-[#b9aca4] sm:text-sm sm:leading-6 lg:text-[15px]">
                Read-only calendar view for accepted guests. Move through months and review the schedule in the same format as the host view.
              </p>
              {refreshing && (
                <p className="text-[9px] tracking-[0.24em] text-[#ffcfaa] sm:text-[10px]">REFRESHING SCHEDULE IN THE BACKGROUND</p>
              )}
              {eventDate && (
                <p className="text-[10px] tracking-[0.24em] text-[#8f8078] sm:text-[11px]">EVENT DATE: {new Date(eventDate).toLocaleDateString()}</p>
              )}
            </div>

            <div className="grid gap-2 grid-cols-3 sm:gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#111821] p-2.5 sm:rounded-2xl sm:p-4">
                <p className="text-[8px] tracking-[0.24em] text-[#8f8078] sm:text-[9px]">MONTH EVENTS</p>
                <p className="mt-1.5 text-2xl font-semibold text-[#ffcfaa] sm:mt-2 sm:text-3xl">{monthEvents.length.toString()}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#111821] p-2.5 sm:rounded-2xl sm:p-4">
                <p className="text-[8px] tracking-[0.24em] text-[#8f8078] sm:text-[9px]">SELECTED DAY</p>
                <p className="mt-1.5 text-sm font-semibold text-[#e8ddd4] sm:mt-2 sm:text-base">{formatShortDay(selectedDateKey)}</p>
                <p className="mt-0.5 text-[9px] tracking-[0.16em] text-[#8f8078] sm:mt-1 sm:text-[11px]">{selectedDateEvents.length} event(s)</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#111821] p-2.5 sm:rounded-2xl sm:p-4">
                <p className="text-[8px] tracking-[0.24em] text-[#8f8078] sm:text-[9px]">STATUS</p>
                <p className="mt-1.5 text-sm font-semibold text-[#a7f3d0] sm:mt-2 sm:text-base">READ ONLY</p>
                <p className="mt-0.5 text-[9px] tracking-[0.16em] text-[#8f8078] sm:mt-1 sm:text-[11px]">Auto-refresh every 60s</p>
              </div>
            </div>
          </motion.section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="rounded-2xl border border-white/10 bg-[#0a0e12]/88 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur sm:rounded-3xl sm:p-4 lg:rounded-[28px] lg:p-5"
            >
              <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.3em] text-[#8f8078] sm:text-[10px]">MONTH NAVIGATION</p>
                  <div className="mt-2 flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => handleMonthChange(-1)}
                      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-[#e8ddd4] transition hover:border-[#ffb77b]/40 hover:bg-[#ffb77b]/10 hover:text-[#ffcfaa] sm:h-11 sm:w-11"
                      aria-label="Previous month"
                    >
                      <LeftIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMonth(toMonthStart(new Date()))}
                      className="rounded-full border border-[#ffb77b]/30 bg-[#2a1f0e] px-3 py-1.5 text-[9px] font-semibold tracking-[0.28em] text-[#ffcfaa] transition hover:bg-[#ffb77b]/15 sm:px-4 sm:py-2 sm:text-[10px]"
                    >
                      TODAY
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMonthChange(1)}
                      className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-[#e8ddd4] transition hover:border-[#ffb77b]/40 hover:bg-[#ffb77b]/10 hover:text-[#ffcfaa] sm:h-11 sm:w-11"
                      aria-label="Next month"
                    >
                      <RightIcon />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[8px] tracking-[0.2em] text-[#a39288] sm:text-[9px] lg:text-[10px]">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CalendarIcon />
                    7-DAY VIEW
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="text-[#ffcfaa] transition hover:text-[#ffd9b5] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {refreshing ? "REFRESHING" : "REFRESH"}
                    </button>
                    <Link
                      href={`/upload/${shareToken}`}
                      className="text-[#ffcfaa] transition hover:text-[#ffd9b5]"
                    >
                      UPLOAD PAGE
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 pb-2 text-center text-[8px] font-semibold tracking-[0.2em] text-[#75665f] sm:grid-cols-6 sm:gap-1.5 sm:pb-2.5 sm:text-[9px] lg:grid-cols-7 lg:gap-2 lg:pb-3 lg:text-[10px]">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((label) => (
                  <div key={label} className="px-0.5 py-0.5 sm:px-1 lg:px-2">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2 lg:grid-cols-7 lg:gap-2">
                {calendarDays.map((day) => {
                  const daySchedules = eventsByDate[day.dateKey] ?? [];
                  const isSelected = selectedDateKey === day.dateKey;
                  const isToday = day.dateKey === startOfToday();
                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => {
                        if (!day.inCurrentMonth) {
                          setViewMonth(keyToDate(day.dateKey));
                        }
                        setSelectedDateKey(day.dateKey);
                      }}
                      className={`group relative min-h-24 rounded-lg border p-1.5 text-left transition sm:min-h-28 sm:rounded-xl sm:p-2 lg:min-h-40 lg:rounded-[22px] lg:p-3 ${
                        day.inCurrentMonth
                          ? "border-white/10 bg-white/[0.035] hover:border-[#ffb77b]/30 hover:bg-[#ffb77b]/6"
                          : "border-white/5 bg-white/10 text-[#6e625d]"
                      } ${isSelected ? "ring-1 ring-[#ffb77b]/60" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-1 sm:gap-2">
                        <div className="flex flex-col items-start gap-0.5 sm:gap-1">
                          <span
                            className={`text-[9px] font-semibold tracking-[0.12em] sm:text-xs lg:text-sm ${
                              day.inCurrentMonth ? "text-[#e8ddd4]" : "text-[#746862]"
                            } ${isToday ? "text-[#ffcfaa]" : ""}`}
                          >
                            {day.day}
                          </span>
                          {isToday && (
                            <span className="rounded-full border border-[#ffb77b]/30 bg-[#2a1f0e] px-1.5 py-0.5 text-[7px] tracking-[0.16em] text-[#ffcfaa] sm:px-2 sm:text-[8px]">
                              TODAY
                            </span>
                          )}
                        </div>

                        {daySchedules.length > 0 && (
                          <span className="rounded-full border border-white/10 bg-black/20 px-1.5 py-0.5 text-[7px] tracking-[0.14em] text-[#a39288] sm:px-2 sm:text-[8px]">
                            {daySchedules.length}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 space-y-1 sm:mt-2 sm:space-y-1.5 lg:mt-3">
                        {daySchedules.slice(0, 2).map((entry) => (
                          <div
                            key={entry.id}
                            className="hidden rounded-lg border border-white/10 bg-[#111821] px-1.5 py-1 text-[8px] leading-3 text-[#efe3d9] shadow-[0_8px_20px_rgba(0,0,0,0.2)] sm:block sm:text-[9px] sm:leading-4 lg:rounded-xl lg:px-2 lg:py-1.5 lg:text-[10px]"
                          >
                            <div className="flex items-center gap-1">
                              <span className="h-1 w-1 shrink-0 rounded-full sm:h-1.5 sm:w-1.5" style={{ backgroundColor: entry.color }} />
                              <span className="truncate font-semibold">{entry.title}</span>
                            </div>
                            <div className="mt-0.5 text-[7px] tracking-[0.16em] text-[#9f8e86] sm:text-[8px]">{entry.start_time}</div>
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <div className="text-[7px] tracking-[0.16em] text-[#8f8078] sm:text-[8px] sm:tracking-[0.18em]">+{daySchedules.length - 2} MORE</div>
                        )}
                      </div>

                      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent opacity-0 transition group-hover:opacity-100" />
                      {day.inCurrentMonth && (
                        <div className="absolute left-2 top-2 h-2 w-2 rounded-full bg-[#ffb77b] opacity-0 shadow-[0_0_18px_rgba(255,183,123,0.9)] transition group-hover:opacity-100" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.14 }}
              className="rounded-2xl border border-white/10 bg-[#0b1016]/88 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur sm:rounded-3xl sm:p-4 lg:rounded-[28px] lg:p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4 sm:gap-3">
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.28em] text-[#8f8078] sm:text-[10px]">DAY AGENDA</p>
                  <h2 className={`${displayFont.className} mt-1.5 text-xl italic text-[#f1ddcc] sm:mt-2 sm:text-3xl`}>{formatShortDay(selectedDateKey)}</h2>
                </div>
                <div className="rounded-full border border-[#ffb77b]/30 bg-[#2a1f0e] px-2.5 py-1.5 text-[8px] tracking-[0.2em] text-[#ffcfaa] sm:px-3 sm:py-2 sm:text-[9px]">
                  {selectedDateEvents.length} ITEM(S)
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {selectedDateEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/2.5 px-3 py-4 text-xs leading-5 text-[#a39288] sm:rounded-2xl sm:px-4 sm:py-6 sm:text-sm sm:leading-6">
                    No events are scheduled for {formatShortDay(selectedDateKey)} yet. Use the month grid to inspect another day.
                  </div>
                ) : (
                  selectedDateEvents.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5 sm:rounded-2xl sm:p-4">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5" style={{ backgroundColor: entry.color }} />
                            <p className="truncate text-xs font-semibold text-[#f1ddcc] sm:text-sm">{entry.title}</p>
                          </div>
                          <p className="mt-1.5 text-[9px] tracking-[0.22em] text-[#9f8e86] sm:mt-2 sm:text-[10px] sm:tracking-[0.24em]">
                            {entry.start_time} - {entry.end_time}
                          </p>
                        </div>
                      </div>
                      {entry.note && <p className="mt-2 text-xs leading-5 text-[#c7bab2] sm:mt-3 sm:text-sm sm:leading-6">{entry.note}</p>}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-[#111821] p-3 sm:mt-5 sm:rounded-3xl sm:p-4">
                <div className="flex items-center gap-1.5 text-[9px] font-semibold tracking-[0.26em] text-[#8f8078] sm:gap-2 sm:text-[10px]">
                  <CalendarIcon />
                  LIVE SYNC
                </div>
                <p className="mt-2 text-xs leading-5 text-[#b9aca4] sm:text-sm sm:leading-6">
                  This calendar refreshes automatically so host changes appear while you stay on the page.
                </p>
                {lastUpdatedAt && <p className="mt-2 text-[9px] tracking-[0.22em] text-[#8f8078]">LAST UPDATED {new Date(lastUpdatedAt).toLocaleString()}</p>}
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/upload/${shareToken}`}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-semibold tracking-[0.18em] text-[#e8ddd4] transition hover:border-[#ffb77b]/40 hover:text-[#ffcfaa]"
                  >
                    BACK TO UPLOAD
                  </Link>
                </div>
              </div>
            </motion.aside>
          </section>
        </div>
      )}
    </main>
  );
}