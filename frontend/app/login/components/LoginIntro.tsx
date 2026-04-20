type LoginIntroProps = {
  displayFontClassName: string;
};

export default function LoginIntro({ displayFontClassName }: LoginIntroProps) {
  return (
    <div className="max-w-140">
      <p className="mb-4 text-[10px] tracking-[0.34em] text-[#ffb77b]">CORE PROTOCOL v0.1</p>

      <h1 className={`${displayFontClassName} text-[66px] leading-[0.9] italic text-[#e5e2e3] md:text-[88px]`}>
        Initialize
        <br />
        Session
      </h1>

      <p className="mt-8 max-w-md text-lg leading-9 text-[#c7b0a6]">
        Entry point for the architectural orchestration of live experiences. Secure access required for
        spatial management.
      </p>
    </div>
  );
}
