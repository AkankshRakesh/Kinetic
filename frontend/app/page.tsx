'use client'
import { Newsreader, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import TrueFocus from "./components/animations/trueFocus";
import { useAuth } from "./providers";

const displayFont = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});


function ActionButton({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  if (variant === "secondary") {
    return (
      <button
        type="button"
        className="bg-transparent px-6 py-3 text-[11px] font-semibold tracking-[0.2em] text-[#ffb77b] outline outline-1 outline-[#444748]/15 transition hover:text-[#ffd0a8]"
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="bg-linear-to-r from-[#ffb77b] to-[#b16d2e] px-6 py-3 text-[11px] font-semibold tracking-[0.2em] text-[#2e1500] transition hover:brightness-110"
    >
      {children}
    </button>
  );
}

function AppSidebar() {
  return (
    <aside
      aria-label="Sidebar"
      className="fixed left-2 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3 rounded-xl bg-[#353436]/60 p-2 backdrop-blur-xl md:left-4 md:gap-4 md:p-3"
    >
      <div className="size-8 rounded-md bg-linear-to-b from-[#3a393a] to-[#2a2a2b] md:size-9" />
      <button type="button" className="size-7 rounded-md bg-[#2a2a2b] text-[#ffb77b] md:size-8" aria-label="Activate stream panel">
        ⌁
      </button>
      <button type="button" className="size-7 rounded-md bg-[#2a2a2b] text-[#e5e2e3] md:size-8" aria-label="Open architecture panel">
        A
      </button>
      <button type="button" className="size-7 rounded-md bg-[#2a2a2b] text-[#e5e2e3] md:size-8" aria-label="Open modules panel">
        ▤
      </button>
      <button type="button" className="size-7 rounded-md bg-[#2a2a2b] text-[#e5e2e3] md:size-8" aria-label="Open analytics panel">
        ◺
      </button>
      <span className="mt-auto size-2 rounded-full bg-[#ffb77b]" aria-hidden="true" />
    </aside>
  );
}

export default function Home() {
  const { status } = useAuth();
  const initializeHref = status === "authenticated" ? "/portal" : "/login";

  return (
    <main
      className={`${uiFont.className} bg-[#131314] text-[#e5e2e3]`}
    >
      {/* <AppSidebar /> */}

      <div className="mx-auto w-full max-w-295">
          <div className="pointer-events-none absolute inset-y-0 right-0 md:w-2/4 w-7/8">
            <img
              src="/landing.gif"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-right"
            />
            <div className="absolute inset-0 bg-linear-to-l from-transparent via-[#131314]/35 to-[#131314]" />
          </div>
        <section className="relative min-h-screen overflow-hidden">

          <header className="relative z-10 mb-16 px-5 md:px-8 flex items-center justify-between gap-4 pt-6 text-[11px] tracking-[0.14em]">
            <a href="#" className="font-bold text-[#e5e2e3] text-2xl">
              KINETIC
            </a>
            <Link
              href={initializeHref}
              className="bg-linear-to-r from-[#ffb77b] to-[#b16d2e] px-6 py-3 text-[11px] font-semibold tracking-[0.2em] text-[#2e1500] transition hover:brightness-110"
            >
              INITIALIZE
            </Link>
          </header>

          <div className="relative z-10 min-h-[calc(100vh-132px)] py-6 px-5 md:px-8">
            <div className="pt-3 md:max-w-[58%] md:pr-8">
              <p className="mb-4 text-[10px] tracking-[0.38em] text-[#ffb77b]">
                SYSTEM V4.0.3 // ONLINE
              </p>
              <h1 className={`${displayFont.className} text-[56px] leading-[0.88] text-[#e5e2e3] sm:text-[78px] md:text-[94px]`}>
                Architecting
              </h1>
              <div className={`${displayFont.className} text-[56px] leading-[0.88] italic text-[#ffb77b] sm:text-[78px] md:text-[94px]`}>
                <TrueFocus
                  sentence="The Unseen."
                  manualMode={false}
                  blurAmount={5}
                  borderColor="#ffb77b"
                  animationDuration={0.5}
                  pauseBetweenAnimations={1}
                  containerClassName="italic items-start gap-[0.16em]"
                  wordClassName="text-inherit font-semibold leading-[0.88]"
                />
              </div>
              <p className=" mt-8 max-w-lg text-sm  text-[#c7b0a6]">
                A generative orchestration environment for high-stakes experiences.
                Move beyond scheduling and build the kinetic structure of your next event.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <ActionButton>INITIALIZE STREAM</ActionButton>
                <ActionButton variant="secondary">READ MANIFESTO</ActionButton>
              </div>
            </div>
          </div>
        </section>

        
      </div>
      <footer className="bg-[#0e0e0f] px-6 py-7">
        <div className="mx-auto flex w-full max-w-295 flex-wrap items-center justify-between gap-4 text-[10px] tracking-[0.16em] text-[#b89a8e] md:px-2">
          <span className="font-semibold text-[#e5e2e3]">KINETIC</span>
          <div className="flex gap-5">
            <a href="#" className="transition hover:text-[#ffb77b]">
              PRIVACY
            </a>
            <a href="#" className="transition hover:text-[#ffb77b]">
              TERMS
            </a>
            <a href="#" className="transition hover:text-[#ffb77b]">
              MANIFESTO
            </a>
          </div>
        </div>
      </footer>

    </main>
  );
}
