import Link from "next/link";


export default function LoginHeader(){
  return (
    <header className="relative z-10 mb-10 flex items-center justify-between gap-4 text-[11px] tracking-[0.14em]">
      <Link href="/" className="text-2xl font-bold text-[#e5e2e3]">
        KINETIC
      </Link>

      <Link
        href="/"
        className="bg-transparent px-6 py-3 text-[11px] font-semibold tracking-[0.2em] text-[#ffb77b] outline-1 outline-[#444748]/40 transition hover:text-[#ffd0a8]"
      >
        BACK
      </Link>
    </header>
  );
}
